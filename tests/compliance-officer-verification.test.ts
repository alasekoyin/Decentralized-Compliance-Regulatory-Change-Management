import { describe, it, expect, beforeEach } from "vitest"

// Mock contract state
let contractState = {
  officers: new Map(),
  officerPrincipals: new Map(),
  nextOfficerId: 1,
  contractOwner: "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",
}

// Mock contract functions
const mockContract = {
  registerOfficer: (name, certification, expiryDate, caller) => {
    if (caller !== contractState.contractOwner) {
      return { error: "err-owner-only" }
    }
    
    if (contractState.officerPrincipals.has(caller)) {
      return { error: "err-already-verified" }
    }
    
    const officerId = contractState.nextOfficerId
    const officerData = {
      principal: caller,
      name,
      certification,
      verified: false,
      verificationDate: 0,
      expiryDate,
    }
    
    contractState.officers.set(officerId, officerData)
    contractState.officerPrincipals.set(caller, { officerId })
    contractState.nextOfficerId++
    
    return { success: officerId }
  },
  
  verifyOfficer: (officerId, caller) => {
    if (caller !== contractState.contractOwner) {
      return { error: "err-owner-only" }
    }
    
    const officer = contractState.officers.get(officerId)
    if (!officer) {
      return { error: "err-invalid-officer" }
    }
    
    officer.verified = true
    officer.verificationDate = Date.now()
    contractState.officers.set(officerId, officer)
    
    return { success: true }
  },
  
  isVerifiedOfficer: (principal) => {
    const officerRecord = contractState.officerPrincipals.get(principal)
    if (!officerRecord) {
      return { success: false }
    }
    
    const officer = contractState.officers.get(officerRecord.officerId)
    return { success: officer ? officer.verified : false }
  },
  
  getOfficerInfo: (officerId) => {
    return contractState.officers.get(officerId) || null
  },
  
  getOfficerByPrincipal: (principal) => {
    const officerRecord = contractState.officerPrincipals.get(principal)
    if (!officerRecord) {
      return null
    }
    return contractState.officers.get(officerRecord.officerId) || null
  },
}

describe("Compliance Officer Verification Contract", () => {
  beforeEach(() => {
    // Reset contract state before each test
    contractState = {
      officers: new Map(),
      officerPrincipals: new Map(),
      nextOfficerId: 1,
      contractOwner: "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",
    }
  })
  
  describe("Officer Registration", () => {
    it("should allow contract owner to register a new officer", () => {
      const result = mockContract.registerOfficer(
          "John Doe",
          "Certified Compliance Professional",
          1000000,
          contractState.contractOwner,
      )
      
      expect(result.success).toBe(1)
      expect(contractState.officers.size).toBe(1)
      expect(contractState.nextOfficerId).toBe(2)
    })
    
    it("should reject registration from non-owner", () => {
      const nonOwner = "SP1234567890ABCDEF"
      const result = mockContract.registerOfficer("Jane Doe", "Compliance Expert", 1000000, nonOwner)
      
      expect(result.error).toBe("err-owner-only")
      expect(contractState.officers.size).toBe(0)
    })
    
    it("should reject duplicate registration", () => {
      // First registration
      mockContract.registerOfficer(
          "John Doe",
          "Certified Compliance Professional",
          1000000,
          contractState.contractOwner,
      )
      
      // Attempt duplicate registration
      const result = mockContract.registerOfficer(
          "John Doe Updated",
          "Updated Certification",
          2000000,
          contractState.contractOwner,
      )
      
      expect(result.error).toBe("err-already-verified")
    })
  })
  
  describe("Officer Verification", () => {
    it("should allow contract owner to verify an officer", () => {
      // Register officer first
      mockContract.registerOfficer(
          "John Doe",
          "Certified Compliance Professional",
          1000000,
          contractState.contractOwner,
      )
      
      // Verify officer
      const result = mockContract.verifyOfficer(1, contractState.contractOwner)
      
      expect(result.success).toBe(true)
      
      const officer = contractState.officers.get(1)
      expect(officer.verified).toBe(true)
      expect(officer.verificationDate).toBeGreaterThan(0)
    })
    
    it("should reject verification from non-owner", () => {
      const nonOwner = "SP1234567890ABCDEF"
      
      // Register officer first
      mockContract.registerOfficer(
          "John Doe",
          "Certified Compliance Professional",
          1000000,
          contractState.contractOwner,
      )
      
      // Attempt verification by non-owner
      const result = mockContract.verifyOfficer(1, nonOwner)
      
      expect(result.error).toBe("err-owner-only")
    })
    
    it("should reject verification of non-existent officer", () => {
      const result = mockContract.verifyOfficer(999, contractState.contractOwner)
      
      expect(result.error).toBe("err-invalid-officer")
    })
  })
  
  describe("Officer Status Checking", () => {
    it("should return false for non-existent officer", () => {
      const result = mockContract.isVerifiedOfficer("SP1234567890ABCDEF")
      
      expect(result.success).toBe(false)
    })
    
    it("should return false for unverified officer", () => {
      // Register but don't verify
      mockContract.registerOfficer(
          "John Doe",
          "Certified Compliance Professional",
          1000000,
          contractState.contractOwner,
      )
      
      const result = mockContract.isVerifiedOfficer(contractState.contractOwner)
      
      expect(result.success).toBe(false)
    })
    
    it("should return true for verified officer", () => {
      // Register and verify
      mockContract.registerOfficer(
          "John Doe",
          "Certified Compliance Professional",
          1000000,
          contractState.contractOwner,
      )
      mockContract.verifyOfficer(1, contractState.contractOwner)
      
      const result = mockContract.isVerifiedOfficer(contractState.contractOwner)
      
      expect(result.success).toBe(true)
    })
  })
  
  describe("Officer Information Retrieval", () => {
    it("should return officer information by ID", () => {
      mockContract.registerOfficer(
          "John Doe",
          "Certified Compliance Professional",
          1000000,
          contractState.contractOwner,
      )
      
      const officer = mockContract.getOfficerInfo(1)
      
      expect(officer).toBeTruthy()
      expect(officer.name).toBe("John Doe")
      expect(officer.certification).toBe("Certified Compliance Professional")
      expect(officer.verified).toBe(false)
    })
    
    it("should return null for non-existent officer ID", () => {
      const officer = mockContract.getOfficerInfo(999)
      
      expect(officer).toBeNull()
    })
    
    it("should return officer information by principal", () => {
      mockContract.registerOfficer(
          "John Doe",
          "Certified Compliance Professional",
          1000000,
          contractState.contractOwner,
      )
      
      const officer = mockContract.getOfficerByPrincipal(contractState.contractOwner)
      
      expect(officer).toBeTruthy()
      expect(officer.name).toBe("John Doe")
      expect(officer.principal).toBe(contractState.contractOwner)
    })
    
    it("should return null for non-existent principal", () => {
      const officer = mockContract.getOfficerByPrincipal("SP1234567890ABCDEF")
      
      expect(officer).toBeNull()
    })
  })
  
  describe("Data Integrity", () => {
    it("should maintain consistent state across operations", () => {
      // Register multiple officers
      const owner = contractState.contractOwner
      const officer1 = "SP1111111111111111"
      const officer2 = "SP2222222222222222"
      
      // Register officers
      mockContract.registerOfficer("Officer 1", "Cert 1", 1000000, owner)
      
      // Temporarily change owner for second registration
      contractState.contractOwner = officer1
      mockContract.registerOfficer("Officer 2", "Cert 2", 2000000, officer1)
      
      // Verify state consistency
      expect(contractState.officers.size).toBe(2)
      expect(contractState.officerPrincipals.size).toBe(2)
      expect(contractState.nextOfficerId).toBe(3)
      
      // Verify specific officer data
      const firstOfficer = mockContract.getOfficerInfo(1)
      const secondOfficer = mockContract.getOfficerInfo(2)
      
      expect(firstOfficer.name).toBe("Officer 1")
      expect(secondOfficer.name).toBe("Officer 2")
      expect(firstOfficer.principal).toBe(owner)
      expect(secondOfficer.principal).toBe(officer1)
    })
  })
})
