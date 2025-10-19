// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IDoctorRegistry} from "../DoctorRegistry/IDoctorRegistry.sol";
import {IPythPriceConsumer} from "../Oracle/IPythPriceConsumer.sol";
import {Structs} from "../Structs.sol";

contract ConsultationEscrow is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum SessionStatus {
        Active,
        Completed
    }

    IDoctorRegistry public immutable doctorRegistry;
    IPythPriceConsumer public immutable pythOracle;
    IERC20 public immutable pyusd;

    uint256 public numSessions;
    mapping(uint256 => Structs.Session) public sessions;
    mapping(address => uint256[]) public patientSessions;
    mapping(uint256 => uint256[]) public doctorSessions;

    uint256 public pyUSDReserveBalance;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    event SessionCreated(uint256 indexed sessionId, uint32 indexed doctorId, address indexed patient, uint256 feeUSD, uint256 pyusdAmount);
    event PaymentReleased(uint256 indexed sessionId, address indexed doctor, uint256 amount);

    constructor(
        address _doctorRegistry,
        address _pythOracle,
        address _pyusd
    ) {
        require(_doctorRegistry != address(0), "Invalid doctor registry");
        require(_pythOracle != address(0), "Invalid oracle");
        require(_pyusd != address(0), "Invalid pyUSD");

        doctorRegistry = IDoctorRegistry(_doctorRegistry);
        pythOracle = IPythPriceConsumer(_pythOracle);
        pyusd = IERC20(_pyusd);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Create and pay for a consultation session in one transaction
     * @param doctorId The ID of the doctor in the registry
     * @param consultationFee Amount the patient is sending for payment
     * @param priceUpdateData Pyth price update data from off-chain API
     *
     */
    function createSession(
        uint32 doctorId,
        uint256 consultationFee,
        bytes[] calldata priceUpdateData
    ) external payable {
        Structs.RegStruct memory doctor = doctorRegistry.getDoctor(doctorId);
        require(doctor.paymentWallet != address(0), "Doctor not found");

        uint256 updateFee = pythOracle.getUpdateFee(priceUpdateData);
        require(address(this).balance >= updateFee, "Insufficient contract ETH for oracle fee");

        uint256 usdValue = pythOracle.getEthToUsd{value: updateFee}(
            consultationFee,
            priceUpdateData
        );

        uint256 pyusdNeeded = (doctor.consultationFeePerHour * 1e6) / 100;

        // Check if USD value from patient's ETH is sufficient
        require(usdValue >= pyusdNeeded, "Insufficient USD value from ETH");

        require(pyUSDReserveBalance >= pyusdNeeded, "Insufficient pyUSD reserve");

        pyUSDReserveBalance -= pyusdNeeded;

        uint256 sessionId = ++numSessions;

        sessions[sessionId] = Structs.Session({
            sessionId: sessionId,
            doctorId: doctorId,
            patient: msg.sender,
            pyusdAmount: pyusdNeeded,
            status: uint8(SessionStatus.Active),
            createdAt: block.timestamp
        });

        patientSessions[msg.sender].push(sessionId);
        doctorSessions[doctorId].push(sessionId);

        emit SessionCreated(sessionId, doctorId, msg.sender, doctor.consultationFeePerHour, pyusdNeeded);
    }

    /**
     * @notice Release payment to doctor after session completion (admin only)
     * @param sessionId The session ID
     */
    function releasePayment(uint256 sessionId) external onlyRole(ADMIN_ROLE) nonReentrant {
        Structs.Session storage session = sessions[sessionId];
        require(session.status == uint8(SessionStatus.Active), "Session not active");

        Structs.RegStruct memory doctor = doctorRegistry.getDoctor(session.doctorId);
        require(doctor.paymentWallet != address(0), "Invalid doctor wallet");

        pyusd.safeTransfer(doctor.paymentWallet, session.pyusdAmount);

        session.status = uint8(SessionStatus.Completed);

        emit PaymentReleased(sessionId, doctor.paymentWallet, session.pyusdAmount);
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
        payable(msg.sender).transfer(amount);
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
     * @notice Receive ETH
     */
    receive() external payable {}
}
