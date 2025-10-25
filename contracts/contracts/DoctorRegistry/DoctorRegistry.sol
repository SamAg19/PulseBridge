// SPDX-License-Identifier: MIT

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IDoctorRegistry} from "./IDoctorRegistry.sol";
import {Structs} from "./../Structs.sol";

pragma solidity 0.8.30;

contract DoctorRegistry is AccessControl, IDoctorRegistry {
    using SafeERC20 for IERC20;

    enum RegStatus {
        PENDING, // 0
        APPROVED, // 1
        DENIED // 2
    }

    mapping(uint32 => Structs.RegStruct) ApprovedRegistry;
    mapping(uint32 => Structs.RegStruct) PendingRegistry;
    mapping(uint32 => uint8) public isRegisterIDApproved;
    mapping(address => uint32) public RegisteredDoctor;
    mapping(address => uint32) public docToRegistrationID;

    address public depositToken;
    uint256 public depositFee;
    uint256 public stakeAmount;
    uint256 public totalPYUsdToBeCollected;

    uint32 public numTotalRegistrations;
    uint32 public numDoctors;

    bytes32 public constant APPROVER = keccak256("APPROVER");
    bytes32 public constant EMPTY_STRING_HASH = keccak256(abi.encodePacked(""));

    event PendingRegistration(address docAddress, uint32 numTotalRegistrations);
    event DepositFeeChanged(uint256 oldFee, uint256 newFee);
    event DoctorRegistered(address docAddress, uint32 registrationId, uint32 docID);
    event DoctorApproved(address docAddress, uint32 registrationId, uint32 docID);
    event DoctorDenied(address pendingDocAddr, uint32 registrationId);

    constructor(address _owner, uint256 _depositFee, uint256 _stakeAmount, address _depositToken) {
        _grantRole(DEFAULT_ADMIN_ROLE, _owner);
        _grantRole(APPROVER, _owner);
        stakeAmount = _stakeAmount;
        depositFee = _depositFee;
        depositToken = _depositToken;
    }

    /**
     * @notice Register as a doctor.
     * @param name Name of the doctor
     * @param specialization Specialization of the doctor
     * @param consultationFees Consultation fees per hour
     * @param legalDocumentsIPFSHash IPFS hash of legal documents
     * required for the registration process.
     */
    function registerAsDoctor(
        string calldata name,
        string calldata specialization,
        string calldata profileDescription,
        string calldata email,
        uint256 consultationFees,
        string calldata legalDocumentsIPFSHash
    ) public {
        require(
            keccak256(abi.encodePacked(legalDocumentsIPFSHash)) != EMPTY_STRING_HASH,
            "Legal documents IPFS hash is required!"
        );

        numTotalRegistrations++;

        PendingRegistry[numTotalRegistrations] = Structs.RegStruct({
            registrationId: numTotalRegistrations,
            doctorId: 0,
            Name: name,
            specialization: specialization,
            profileDescription: profileDescription,
            email: email,
            doctorAddress: msg.sender,
            consultationFeePerHour: consultationFees,
            depositFeeStored: depositFee,
            legalDocumentsIPFSHash: legalDocumentsIPFSHash
        });

        docToRegistrationID[msg.sender] = numTotalRegistrations;

        totalPYUsdToBeCollected += depositFee;

        IERC20(depositToken).transferFrom(msg.sender, address(this), stakeAmount);
        emit PendingRegistration(msg.sender, numTotalRegistrations);
    }

    /**
     * @notice Approves an doctor and turns him into an ActiveDoctor
     * @param _pendingDoctor the doctor that gets approved.
     */
    function approveDoctor(address _pendingDoctor) public onlyRole(APPROVER) {
        (Structs.RegStruct memory Docreg, ) = getPendingDoctor(_pendingDoctor);

        numDoctors++;

        ApprovedRegistry[numDoctors] = Docreg;
        ApprovedRegistry[numDoctors].doctorId = numDoctors;
        isRegisterIDApproved[Docreg.registrationId] = uint8(RegStatus.APPROVED);

        RegisteredDoctor[Docreg.doctorAddress] = numDoctors;
        IERC20(depositToken).transfer(Docreg.doctorAddress, stakeAmount - Docreg.depositFeeStored);
        emit DoctorApproved(_pendingDoctor, Docreg.registrationId, numDoctors);
    }

    /**
     * @notice Approves an doctor and turns him into an ActiveDoctor
     * @param _pendingDoctor the doctor that gets approved.
     */
    function denyDoctor(address _pendingDoctor) public onlyRole(APPROVER) {
        (Structs.RegStruct memory Docreg, ) = getPendingDoctor(_pendingDoctor);
        totalPYUsdToBeCollected += stakeAmount - Docreg.depositFeeStored;

        isRegisterIDApproved[Docreg.registrationId] = uint8(RegStatus.DENIED);

        emit DoctorDenied(_pendingDoctor, Docreg.registrationId);
    }

    /**
     * @notice Allows the Admin to withdraw the depositFees from the denied application.
     * Admin is TRUSTED.
     */
    function withdrawDepositFees() public onlyRole(DEFAULT_ADMIN_ROLE) {
        IERC20(depositToken).transfer(msg.sender, totalPYUsdToBeCollected);
        totalPYUsdToBeCollected = 0;
    }

    /**
     * @notice Allows the Admin to change the depositFee needed to register as an doctor.
     */
    function changeDepositFee(uint256 _newDepositFee) public onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 _oldFee = depositFee;
        depositFee = _newDepositFee;
        emit DepositFeeChanged(_oldFee, _newDepositFee);
    }

    /**
     * @notice get a specific doctor by their docID
     * @param _docID the specific doctor you want returned.
     */
    function getDoctor(uint32 _docID) public view returns (Structs.RegStruct memory DS) {
        return ApprovedRegistry[_docID];
    }

    /**
     * @notice get a doctorID by their address
     * @param _doctorAddress the  specific address you want the ID from.
     */
    function getDoctorID(address _doctorAddress) public view returns (uint32) {
        return RegisteredDoctor[_doctorAddress];
    }

    /**
     * @notice returns an NON-APPROVED doctor
     * @param _pendingDoctor the specific NON-APPROVED doctor you want returned.
     */
    function getPendingDoctor(address _pendingDoctor) public view returns (Structs.RegStruct memory DS, uint8 status) {
        uint32 registerId = docToRegistrationID[_pendingDoctor];
        return (PendingRegistry[registerId], isRegisterIDApproved[registerId]);
    }

    /**
     * @notice returns an NON-APPROVED doctor by their registrationID
     * @param _registrationId the specific NON-APPROVED doctor you want returned.
     */
    function getPendingDoctorInfoByID(uint32 _registrationId) public view returns (Structs.RegStruct memory DS, uint8 status) {
        return (PendingRegistry[_registrationId], isRegisterIDApproved[_registrationId]);
    }
}