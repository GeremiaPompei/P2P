const Lottery = artifacts.require("Lottery");

contract("Lottery", accounts => {
  const owner = accounts[0];
  const player1 = accounts[1];
  const player2 = accounts[2];
  const player3 = accounts[3];
  it("should lottery state be BUY", async () => {
    const instance = await Lottery.deployed();
    const state = await instance.state({from: owner});
    assert.equal(state, "BUY", "round state isn't correct");
  });
});