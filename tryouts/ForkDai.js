const { expect } = require("chai");


const impersonateAddress = async (address) => {
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [address],
  });

  const signer = await ethers.provider.getSigner(address);
  signer.address = signer._address;
  
  return signer;
}

describe("Hack", function () {
  const me = '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199';
  const whale = '0x04ad0703b9c14a85a02920964f389973e094e153';

  it("test", async () => {
    let dai = await ethers.getContractAt('IERC20', '0x6b175474e89094c44da98b954eedeac495271d0f');

    const whaleSigner = await impersonateAddress(whale);

    let balance = await dai.balanceOf(me);
    console.log(
      "our very own balance (before) ",
      ethers.utils.formatEther(balance)
    )

    dai = dai.connect(whaleSigner);
    await dai.transfer(me, ethers.utils.parseEther('500000'));


    balance = await dai.balanceOf(me);
    console.log(
      "our very own balance (after) ",
      ethers.utils.formatEther(balance)
    )
  });

});
