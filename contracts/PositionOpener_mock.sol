// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PositionOpener_mock {
  event PositionOpened(
    uint256 indexed nftId,
    address indexed user,
    address indexed strategy,
    uint256 collateralAmount,
    uint256 wbtcToBorrow,
    uint256 positionExpireBlock,
    uint256 sharesReceived
  );

  // Function to emit the PositionOpened event
  function openPosition(
    uint256 _nftID,
    address _user,
    address _strategy,
    uint256 _collateralAmount,
    uint256 _wbtcToBorrow,
    uint256 _positionExpireBlock,
    uint256 _sharesReceived
  ) external {
    // Emit the PositionOpened event with the provided parameters
    emit PositionOpened(
      _nftID,
      _user,
      _strategy,
      _collateralAmount,
      _wbtcToBorrow,
      _positionExpireBlock,
      _sharesReceived
    );
  }
}
