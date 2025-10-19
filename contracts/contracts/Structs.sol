// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

library Structs {
    struct RegStruct {
        string Name;
        string specilization;
        address paymentWallet;
        uint256 consultationFeePerHour;
        uint256 depositFeeStored;
    }

    struct Session {
        uint8 status;
        uint32 doctorId;
        uint32 sessionId;
        address patient;
        uint256 pyusdAmount;         
        uint256 createdAt;
    }
} 