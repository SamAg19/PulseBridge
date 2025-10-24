// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

library Structs {
    struct RegStruct {
        string Name;
        string specialization;
        string profileDescription;
        string email;
        address doctorAddress;
        uint256 consultationFeePerHour;
        uint256 depositFeeStored;
        string legalDocumentsIPFSHash;
    }

    struct Session {
        uint8 status;
        uint32 doctorId;
        uint256 sessionId;
        address patient;
        string doctorPrescriptionIPFSHash;
        uint256 pyusdAmount;         
        uint256 createdAt;
        uint256 startTime;
    }
} 