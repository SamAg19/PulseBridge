// SPDX-License-Identifier: MIT

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

pragma solidity 0.8.30;

contract DoctorRegistry is AccessControl {
    using SafeERC20 for IERC20;

    struct RegStruct {
        string Name;
        string specilization;
        address paymentWallet;
        uint256 consultationFeePerHour;
    }

    uint256 public depositFee;
    uint32 doctorID;
    bytes32 public constant APPROVER = keccak256("APPROVER");

    mapping(uint32 => RegStruct) ApprovedRegistry;
    mapping(uint256 => RegStruct) PendingRegistry;

    event PendingRegistration(uint32 docID);
    event DepositFeeChanged(uint256 newFee);
    event DoctorRegistered(uint32 docID);
    event DoctorApproved(uint32 docID);
    event DoctorDenied(uint32 docID);

    constructor(address _owner, uint256 _depositFee) {
        _grantRole(DEFAULT_ADMIN_ROLE, _owner);
        depositFee = _depositFee;
    }

    function registerAsDoctor(RegStruct memory regStruct) public {
        // Needs to pay a depositFee.. or., lock their deposit from the depositContract.
        doctorID++;
        PendingRegistry[doctorID] = regStruct;
        emit PendingRegistration(doctorID);
    }

    function approveDoctor(uint32 _docID) public onlyRole(APPROVER) {
        RegStruct memory Docreg = getPendingDoctor(_docID);
        ApprovedRegistry[_docID] = Docreg;
        emit DoctorApproved(doctorID);
    }

    function denyDoctor(uint32 _docID) public onlyRole(APPROVER) {
        delete PendingRegistry[_docID];
        emit DoctorDenied(_docID);
    }

    function changeDepositFee(uint256 _newDepositFee) public onlyRole(DEFAULT_ADMIN_ROLE) {
        depositFee = _newDepositFee;
        emit DepositFeeChanged(_newDepositFee);
    }

    function getDoctor(uint32 _docID) public view returns (RegStruct memory DS) {
        return ApprovedRegistry[_docID];
    }

    function getPendingDoctor(uint32 _docID) public view returns (RegStruct memory DS) {
        return PendingRegistry[_docID];
    }
}
