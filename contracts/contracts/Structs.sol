// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

library Structs {
    struct RegStruct {
        string Name;
        string specilization;
        address paymentWallet;
        uint256 consultationFeePerHour;
    }

    struct Session {
        uint256 sessionId;
        uint32 doctorId;
        address patient;
        uint256 pyusdAmount;         
        uint8 status;
        uint256 createdAt;
    }
} 