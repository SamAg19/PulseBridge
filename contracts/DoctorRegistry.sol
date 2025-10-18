// SPDX-License-Identifier: MIT

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

pragma solidity 0.8.30;

contract DoctorRegistry is AccessControl {
    using SafeERC20 for IERC20;

    mapping(uint32 => RegStruct) ApprovedRegistry;
    mapping(uint256 => RegStruct) PendingRegistry;

    struct RegStruct {
        string Name;
        string specilization;
        address paymentWallet;
        uint256 consultationFee;
    }

    uint256 depositFee;
    uint32 doctorID;

    bytes32 public constant APPROVER = keccak256("APPROVER");

    event DoctorRegistered(uint32 docID);
    event PendingRegistration(uint32 docID);
    event DoctorApproved(uint32 docID);
    event DoctorDenied(uint32 docID);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function registerAsDoctor(RegStruct memory regStruct) public {
        doctorID++;
        PendingRegistry[doctorID] = regStruct;
        emit PendingRegistration(doctorID);
    }

    function approveDoctor(uint32 _docID) public onlyRole(APPROVER) {
        emit DoctorApproved(doctorID);
    }

    function declineDoctor(uint32 _docID) public onlyRole(APPROVER) {
        delete PendingRegistry[_docID];
    }

    function changeDepositFee(uint256 _newDepositFee) public onlyRole(DEFAULT_ADMIN_ROLE) {
        depositFee = _newDepositFee;
    }

    function getDoctor(uint32 _docID) public view returns (RegStruct memory DS) {
        return ApprovedRegistry[_docID];
    }
}
