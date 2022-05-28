const Lottery = artifacts.require("Lottery");

contract("Lottery", accounts => {
  const owner = accounts[0];
  const player1 = accounts[1];
  const player2 = accounts[2];
  const player3 = accounts[3];
  it("should lottery be active", async () => {
    const instance = await Lottery.deployed();
    const status = await instance.isRoundActive({from: owner});
    assert.isTrue(status, "round is not active");
    assert.throws(async () => await instance.startNewRound({from: owner}), "new round can't be opened");
    assert.throws(async () => await instance.startNewRound({from: player1}), "players can't open new round");
  });
});