// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IDoctorRegistry} from "../DoctorRegistry/IDoctorRegistry.sol";
import {IPythPriceConsumer} from "../Oracle/IPythPriceConsumer.sol";
import {Structs} from "../Structs.sol";
import "hardhat/console.sol";

contract ConsultationEscrow is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum SessionStatus {
        Active,
        Completed
    }

    IDoctorRegistry public immutable doctorRegistry;
    IPythPriceConsumer public immutable pythOracle;
    IERC20 public immutable pyusd;
    IERC20 public immutable usdc;
    IERC20 public immutable usdt;

    uint256 public numSessions;
    mapping(uint256 => Structs.Session) sessions;
    mapping(address => uint256[]) patientSessions;
    mapping(uint256 => uint256[]) doctorSessions;
    mapping(uint256 => uint8[]) doctorRatings;

    uint256 public pyUSDReserveBalance;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant EMPTY_STRING_HASH = keccak256(abi.encodePacked(""));

    event SessionCreated(
        uint256 indexed sessionId, uint32 indexed doctorId, address indexed patient, uint256 feeUSD, uint256 pyusdAmount
    );

    event PaymentReleased(uint256 indexed sessionId, address indexed doctor, uint256 amount);
    event DoctorRated(uint32 doctorId, uint256 sessionID, uint16 rating);

    constructor(address _doctorRegistry, address _pythOracle, address _pyusd, address _usdc, address _usdt) {
        doctorRegistry = IDoctorRegistry(_doctorRegistry);
        pythOracle = IPythPriceConsumer(_pythOracle);
        pyusd = IERC20(_pyusd);
        usdc = IERC20(_usdc);
        usdt = IERC20(_usdt);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Create and pay for a consultation session in one transaction
     * @param doctorId The ID of the doctor in the registry
     * @param consultationPayment Amount the patient is sending for payment
     * @param priceUpdateData Pyth price update data from off-chain API
     *
     */
    function createSession(
        uint32 doctorId,
        uint256 consultationPayment,
        bytes[] calldata priceUpdateData,
        address tokenAddress,
        uint256 startTime
    ) external payable {
        Structs.RegStruct memory doctor = doctorRegistry.getDoctor(doctorId);
        require(doctor.doctorAddress != address(0), "Doctor not found");
        require(startTime > block.timestamp, "Invalid start time");

        uint256 updateFee = pythOracle.getUpdateFee(priceUpdateData);
        require(address(this).balance >= updateFee, "Insufficient contract ETH for oracle fee");

        // uint256 pyusdNeeded = (doctor.consultationFeePerHour * 1e6) / 100;
        uint256 pyusdNeeded = doctor.consultationFeePerHour;

        // check if msg.value > 0, then use oracle, else
        uint256 pyusdValue;
        IERC20 paymentMethod;

        if (msg.value > 0) {
            pyusdValue = pythOracle.getEthToPyusd{value: updateFee}(msg.value, priceUpdateData);
        } else if (tokenAddress == address(usdc)) {
            pyusdValue = pythOracle.getUsdcToPyusd{value: updateFee}(consultationPayment, priceUpdateData);
            paymentMethod = usdc;
        } else if (tokenAddress == address(usdt)) {
            pyusdValue = pythOracle.getUsdtToPyusd{value: updateFee}(consultationPayment, priceUpdateData);
            paymentMethod = usdt;
        } else if (tokenAddress == address(pyusd)) {
            pyusdValue = consultationPayment;
            paymentMethod = pyusd;
        } else {
            revert("Invalid payment");
        }

        // Check if converted value is sufficient

        require(pyusdValue >= pyusdNeeded, "Insufficient payment value");

        require(pyUSDReserveBalance >= pyusdNeeded, "Insufficient pyUSD reserve");

        pyUSDReserveBalance -= pyusdNeeded;

        uint256 sessionId = ++numSessions;

        sessions[sessionId] = Structs.Session({
            status: uint8(SessionStatus.Active),
            doctorId: doctorId,
            sessionId: sessionId,
            patient: msg.sender,
            doctorPrescriptionIPFSHash: "",
            pyusdAmount: pyusdNeeded,
            createdAt: block.timestamp,
            startTime: startTime
        });

        patientSessions[msg.sender].push(sessionId);
        doctorSessions[doctorId].push(sessionId);

        // Transfer payment tokens from patient to contract
        if (address(paymentMethod) == address(0)) {
            // For ETH payments, refund excess pyUSD if pyusdValue exceeds what was needed
            if (pyusdValue > pyusdNeeded) {
                uint256 excessPyusd = pyusdValue - pyusdNeeded;
                pyusd.safeTransfer(msg.sender, excessPyusd);
                pyUSDReserveBalance -= excessPyusd;
            }
        } else {
            // Transfer the full payment amount from user
            IERC20(paymentMethod).safeTransferFrom(msg.sender, address(this), consultationPayment);

            // Refund excess value in pyUSD if user sent more than needed
            if (pyusdValue > pyusdNeeded) {
                uint256 excessPyusd = pyusdValue - pyusdNeeded;
                pyusd.safeTransfer(msg.sender, excessPyusd);
                pyUSDReserveBalance -= excessPyusd;
            }
        }

        emit SessionCreated(sessionId, doctorId, msg.sender, doctor.consultationFeePerHour, pyusdNeeded);
    }

    /**
     * @notice Rate the sessions from your doctor.
     * @param _sessionID The session ID
     * @param _rating rate your experience.
     */
    function rateSession(uint256 _sessionID, uint8 _rating) external {
        require(_rating <= 100, "Rating needs to between 0-100");

        Structs.Session memory session = sessions[_sessionID];
        require(session.patient == msg.sender, "Not the patient");
        require(session.status == uint8(SessionStatus.Completed), "Session not Completed");

        doctorRatings[session.doctorId].push(_rating);

        emit DoctorRated(session.doctorId, _sessionID, _rating);
    }

    /**
     * @notice Release payment to doctor after session completion (admin only)
     * @param sessionId The session ID
     */
    function releasePayment(uint256 sessionId, string calldata ipfsHash) external nonReentrant {
        Structs.Session storage session = sessions[sessionId];
        require(session.status == uint8(SessionStatus.Active), "Session not active");
        require(block.timestamp > session.startTime, "Session not started");

        Structs.RegStruct memory doctor = doctorRegistry.getDoctor(session.doctorId);
        require(doctor.doctorAddress == msg.sender, "Invalid doctor caller");
        require(keccak256(abi.encodePacked(ipfsHash)) != EMPTY_STRING_HASH, "IPFS hash is required");

        pyusd.safeTransfer(doctor.doctorAddress, session.pyusdAmount);

        session.status = uint8(SessionStatus.Completed);
        session.doctorPrescriptionIPFSHash = ipfsHash;

        emit PaymentReleased(sessionId, doctor.doctorAddress, session.pyusdAmount);
    }

    /**
     * @notice Deposit pyUSD to contract reserve
     * @param amount Amount of pyUSD to deposit
     */
    function depositPyusdReserve(uint256 amount) external {
        require(amount > 0, "Invalid amount");
        pyUSDReserveBalance += amount;
        pyusd.safeTransferFrom(msg.sender, address(this), amount);
    }

    /**
     * @notice Withdraw pyUSD reserve (admin only)
     * @param amount Amount to withdraw
     */
    function withdrawPyusdReserve(uint256 amount) external onlyRole(ADMIN_ROLE) {
        require(pyUSDReserveBalance >= amount, "Insufficient balance");
        pyUSDReserveBalance -= amount;
        pyusd.safeTransfer(msg.sender, amount);
    }

    /**
     * @notice Withdraw ETH (admin only)
     * @param amount Amount to withdraw
     */
    function withdrawEth(uint256 amount) external onlyRole(ADMIN_ROLE) {
        require(amount > 0, "Invalid amount");
        (bool success,) = msg.sender.call{value: amount}("");
        require(success);
    }

    /**
     * @notice Get session details
     * @param sessionId Session ID
     * @return Session struct
     */
    function getSession(uint256 sessionId) external view returns (Structs.Session memory) {
        return sessions[sessionId];
    }

    /**
     * @notice Get patient sessions
     * @param patient Patient address
     * @return Array of session IDs
     */
    function getPatientSessions(address patient) external view returns (uint256[] memory) {
        return patientSessions[patient];
    }

    /**
     * @notice Get doctor sessions
     * @param doctorId Doctor ID
     * @return Array of session IDs
     */
    function getDoctorSessions(uint32 doctorId) external view returns (uint256[] memory) {
        return doctorSessions[doctorId];
    }

    /**
     * @notice Get doctor ratings
     * @param doctorId Doctor ID
     * @return Array of ratings IDs
     */
    function getDoctorRatings(uint32 doctorId) external view returns (uint8[] memory) {
        return doctorRatings[doctorId];
    }

    /**
     * @notice Receive ETH
     */
    receive() external payable {}
}
