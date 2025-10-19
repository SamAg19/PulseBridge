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
    uint32 doctorID;
    bytes32 public constant APPROVER = keccak256("APPROVER");

    event PendingRegistration(uint32 docID);
    event DepositFeeChanged(uint256 newFee);
    event DoctorRegistered(uint32 docID);
    event DoctorApproved(uint32 docID);
    event DoctorDenied(uint32 docID);

    constructor(address _owner, uint256 _depositFee, address _depositToken) {
        _grantRole(DEFAULT_ADMIN_ROLE, _owner);
        depositFee = _depositFee;
        depositToken = _depositToken;
    }

    function registerAsDoctor(Structs.RegStruct memory regStruct) public {
        doctorID++;
        PendingRegistry[doctorID] = regStruct;
        IERC20(depositToken).transferFrom(msg.sender, address(this), depositFee);
        emit PendingRegistration(doctorID);
    }

    function approveDoctor(uint32 _docID) public onlyRole(APPROVER) {
        Structs.RegStruct memory Docreg = getPendingDoctor(_docID);
        ApprovedRegistry[_docID] = Docreg;
        emit DoctorApproved(doctorID);
    }

    function denyDoctor(uint32 _docID) public onlyRole(APPROVER) {
        delete PendingRegistry[_docID];
        emit DoctorDenied(_docID);
    }

    function withdrawDepositFees() public onlyRole(DEFAULT_ADMIN_ROLE) {
        IERC20(depositToken).transfer(msg.sender, IERC20(depositToken).balanceOf(address(this)));
    }

    function changeDepositFee(uint256 _newDepositFee) public onlyRole(DEFAULT_ADMIN_ROLE) {
        depositFee = _newDepositFee;
        emit DepositFeeChanged(_newDepositFee);
    }

    function getDoctor(uint32 _docID) public view returns (Structs.RegStruct memory DS) {
        return ApprovedRegistry[_docID];
    }

    function getPendingDoctor(uint32 _docID) public view returns (Structs.RegStruct memory DS) {
        return PendingRegistry[_docID];
    }
}
