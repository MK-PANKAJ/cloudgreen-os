import { expect } from "chai";
import { ethers } from "hardhat";

describe("CloudGreenCredential", function () {
  it("issues and stores a credential", async function () {
    const [owner, subject] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("CloudGreenCredential");
    const contract = await Factory.deploy(owner.address);
    await contract.waitForDeployment();

    const tx = await contract.issueCredential(subject.address, "cred-123");
    await tx.wait();

    const hash = ethers.keccak256(ethers.solidityPacked(["address", "string"], [subject.address, "cred-123"]));
    const credential = await contract.getCredential(hash);

    expect(credential.subject).to.equal(subject.address);
    expect(credential.credentialId).to.equal("cred-123");
  });
});
