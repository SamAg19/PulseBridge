// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

contract DoctorRegistry {
    mapping(uint32 => RegStruct) ApprovedRegistry;
    mapping(uint256 => RegStruct) PendingRegistry;

    uint256 registerFee;

    struct RegStruct {
        string Name;
        string specilization;
        address paymentWallet;
        uint256 consultationFee;
    }

    function registerAsTherapist() public {}

    function getDoctor(uint32 _docID) public view returns (RegStruct memory DS) {
        return ApprovedRegistry[_docID];
    }

    function approveDoctor(uint32 _docID) public {}
    function removeDoctor(uint32 _docID) public {}
}
