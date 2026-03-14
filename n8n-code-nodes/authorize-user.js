/**
 * n8n Code Node: User Authorization
 *
 * Place this Code node immediately after the Telegram Trigger node
 * in both the Sales & Commands and Consignment Receive workflows.
 *
 * It checks the incoming Telegram user ID against an allowed list
 * and restricts admin-only commands to Mai.
 *
 * Outputs:
 *   - Output 0 ("authorized"): User is allowed to proceed
 *   - Output 1 ("unauthorized"): User is blocked
 *   - Output 2 ("forbidden"): User is known but lacks permission for this command
 *
 * Usage in n8n:
 *   1. Add a Code node after the Telegram Trigger
 *   2. Set "Mode" to "Run Once for Each Item"
 *   3. Paste this code
 *   4. Connect output 0 to the existing command router
 *   5. Connect outputs 1 and 2 to a "Send Message" node that replies with an error
 */

// --- Configuration ---

// Allowed Telegram user IDs (add staff IDs as they are confirmed)
const ALLOWED_USERS = {
  8449351519: { name: 'Mai', role: 'owner' },
  // Add staff IDs here as they are confirmed:
  // 123456789: { name: 'Linh', role: 'staff' },
  // 234567890: { name: 'Thái', role: 'staff' },
  // 345678901: { name: 'Huyền', role: 'staff' },
};

// Commands restricted to Mai (owner) only
const OWNER_ONLY_COMMANDS = ['/ks', '/bctc', '/settle', '/payroll'];

// --- Logic ---

const message = $input.item.json.message || $input.item.json.callback_query?.message;
const from = $input.item.json.message?.from || $input.item.json.callback_query?.from;

if (!from) {
  // No sender info — reject
  return { json: { authorized: false, reason: 'no_sender_info' } };
}

const userId = from.id;
const userName = from.first_name || from.username || 'Unknown';
const user = ALLOWED_USERS[userId];

// Check 1: Is user in the allowed list?
if (!user) {
  return [
    [], // output 0: authorized (empty)
    [   // output 1: unauthorized
      {
        json: {
          authorized: false,
          reason: 'not_in_allowed_list',
          userId,
          userName,
          chatId: message?.chat?.id || from.id,
          replyText: 'Sorry, you are not authorized to use this bot.',
        },
      },
    ],
    [], // output 2: forbidden (empty)
  ];
}

// Check 2: Is this an owner-only command used by non-owner?
const text = ($input.item.json.message?.text || '').trim().toLowerCase();
const command = text.split(/\s+/)[0]; // first word, e.g. "/ks"

if (OWNER_ONLY_COMMANDS.includes(command) && user.role !== 'owner') {
  return [
    [], // output 0: authorized (empty)
    [], // output 1: unauthorized (empty)
    [   // output 2: forbidden
      {
        json: {
          authorized: false,
          reason: 'insufficient_permissions',
          userId,
          userName,
          userRole: user.role,
          command,
          chatId: message?.chat?.id || from.id,
          replyText: `Sorry ${user.name}, the ${command} command is restricted to the owner.`,
        },
      },
    ],
  ];
}

// Authorized — pass through original data with user info attached
return [
  [ // output 0: authorized
    {
      json: {
        ...$input.item.json,
        _auth: {
          userId,
          userName: user.name,
          userRole: user.role,
          authorized: true,
        },
      },
    },
  ],
  [], // output 1: unauthorized (empty)
  [], // output 2: forbidden (empty)
];
