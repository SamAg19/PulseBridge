// SPDX-License-Identifier: MIT

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IDoctorRegistry} from "./IDoctorRegistry.sol";
import {Structs} from "./../Structs.sol";

pragma solidity 0.8.30;

contract DoctorRegistry is AccessControl, IDoctorRegistry {
    using SafeERC20 for IERC20;

    mapping(uint32 => Structs.RegStruct) ApprovedRegistry;
    mapping(uint256 => Structs.RegStruct) PendingRegistry;

    address public depositToken;
    uint256 public depositFee;
    uint256 public stakeAmount;
    uint32 doctorID;
    bytes32 public constant APPROVER = keccak256("APPROVER");

    event PendingRegistration(uint32 docID);
    event DepositFeeChanged(uint256 oldFee, uint256 newFee);
    event DoctorRegistered(uint32 docID);
    event DoctorApproved(uint32 docID);
    event DoctorDenied(uint32 docID);

    constructor(address _owner, uint256 _depositFee, address _depositToken) {
        _grantRole(DEFAULT_ADMIN_ROLE, _owner);
        depositFee = _depositFee;
        depositToken = _depositToken;
    }

    /**
     * @notice Register as a doctor.
     * @param regStruct has Name, Services, Consultation Fee, and Payment wallet
     * required for the registration process.
     */
    function registerAsDoctor(Structs.RegStruct memory regStruct) public {
        require(regStruct.paymentWallet != address(0x0), "Wallet cannot be a zero address!");

        doctorID++;
        regStruct.depositFeeStored = depositFee;
        PendingRegistry[doctorID] = regStruct;

        IERC20(depositToken).transferFrom(msg.sender, address(this), stakeAmount);
        emit PendingRegistration(doctorID);
    }

    /**
     * @notice Approves an doctor and turns him into an ActiveDoctor
     * @param _docID the doctor that gets approved.
     */
    function approveDoctor(uint32 _docID) public onlyRole(APPROVER) {
        Structs.RegStruct memory Docreg = getPendingDoctor(_docID);
        ApprovedRegistry[_docID] = Docreg;
        IERC20(depositToken).transfer(Docreg.paymentWallet, stakeAmount - Docreg.depositFeeStored);
        emit DoctorApproved(doctorID);
    }

    /**
     * @notice Approves an doctor and turns him into an ActiveDoctor
     * @param _docID the doctor that gets approved.
     */
    function denyDoctor(uint32 _docID) public onlyRole(APPROVER) {
        delete PendingRegistry[_docID];
        emit DoctorDenied(_docID);
    }

    /**
     * @notice Allows the Admin to withdraw the depositFees from the denied application.
     * Admin is TRUSTED.
     */
    function withdrawDepositFees() public onlyRole(DEFAULT_ADMIN_ROLE) {
        IERC20(depositToken).transfer(msg.sender, IERC20(depositToken).balanceOf(address(this)));
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
     * @notice returns an NON-APPROVED doctor
     * @param _docID the specific NON-APPROVED doctor you want returned.
     */
    function getPendingDoctor(uint32 _docID) public view returns (Structs.RegStruct memory DS) {
        return PendingRegistry[_docID];
    }
}
