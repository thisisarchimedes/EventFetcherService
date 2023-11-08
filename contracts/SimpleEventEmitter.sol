// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleEventEmitter {
  event SimpleEvent(address indexed sender, uint256 indexed value);

  function emitEvent(uint256 _value) external {
    emit SimpleEvent(msg.sender, _value);
  }
}
