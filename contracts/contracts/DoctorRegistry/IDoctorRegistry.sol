// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import "./../Structs.sol";

interface IDoctorRegistry {
    function getDoctor(uint32 _docID) external view returns (Structs.RegStruct memory DS);

}