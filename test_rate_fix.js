// Test case simulation
const paymentRates = [
    { program_level: "Masteral", type: "Adviser", defense_type: "Proposal", amount: 1001 },
    { program_level: "Masteral", type: "Panel Chair", defense_type: "Proposal", amount: 200 },
    { program_level: "Masteral", type: "Panel Member 1", defense_type: "Proposal", amount: 300 },
    { program_level: "Masteral", type: "Panel Member 2", defense_type: "Proposal", amount: 300 },
    { program_level: "Masteral", type: "Panel Member 3", defense_type: "Proposal", amount: 300 },
];

const request = {
    program_level: "Masteral",
    defense_type: "Proposal"
};

function getMemberReceivable(role) {
    if (!request.program_level || !request.defense_type) {
        return null;
    }
    
    // Map role to payment rate type EXACTLY as stored in DB
    let rateType = '';
    if (role === 'Adviser') {
        rateType = 'Adviser';
    } else if (role === 'Panel Chair' || role === 'Chairperson') {
        rateType = 'Panel Chair';
    } else if (role.includes('Panel Member')) {
        // Keep the full role name including number
        rateType = role;
    } else if (role === 'Panelist') {
        rateType = 'Panel Member 1';
    } else {
        rateType = role;
    }
    
    const normalizeDefenseType = (dt) => dt.toLowerCase().replace(/[^a-z]/g, '');
    const targetDefenseType = normalizeDefenseType(request.defense_type);
    
    console.log(`Looking for: role="${role}" -> rateType="${rateType}"`);
    
    const rate = paymentRates.find(r => {
        const matchesProgram = r.program_level === request.program_level;
        const matchesType = r.type === rateType;
        const matchesDefense = normalizeDefenseType(r.defense_type) === targetDefenseType;
        return matchesProgram && matchesType && matchesDefense;
    });
    
    if (rate) {
        console.log(`✓ Found: ${rate.type} = ${rate.amount}`);
    } else {
        console.log(`✗ Not found`);
    }
    
    return rate ? Number(rate.amount) : null;
}

// Test all roles
console.log("=== TESTING RATE LOOKUPS ===\n");
const roles = ['Adviser', 'Panel Chair', 'Panel Member 1', 'Panel Member 2', 'Panel Member 3'];

roles.forEach(role => {
    const amount = getMemberReceivable(role);
    console.log(`${role}: ${amount ? '₱' + amount : 'NOT FOUND'}\n`);
});
