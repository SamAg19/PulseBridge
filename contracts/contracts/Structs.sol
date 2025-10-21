// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

library Structs {
    struct RegStruct {
        string Name;
        string specialization;
        address doctorAddress;
        uint256 consultationFeePerHour;
        uint256 depositFeeStored;
        bytes32 legalDocumentsIPFSHash;
    }

    struct Session {
        uint8 status;
        uint32 doctorId;
        uint32 sessionId;
        address patient;
        bytes32 doctorPrescriptionIPFSHash;
        uint256 pyusdAmount;         
        uint256 createdAt;
    }
} 