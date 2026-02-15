/**
 * DonationSheetAutomation.gs
 *
 * Google Apps Script for the Razorpay Donation Tracker sheet.
 *
 * ─── FEATURES ────────────────────────────────────────────────────────
 *  1. WEBHOOK: Receives Razorpay payment.captured events via doPost()
 *     and automatically inserts new payment rows into the sheet.
 *  2. TOTAL ROW: Maintains a "Total Amount" summary row at the bottom
 *     that sums all captured payment amounts.
 *  3. DEDUPLICATION: Skips payments that already exist in the sheet
 *     (checked by Payment_id).
 *
 * ─── SETUP ───────────────────────────────────────────────────────────
 *  1. Open your Google Sheet → Extensions → Apps Script
 *  2. Paste this entire file → Click 💾 Save
 *  3. Select `installTrigger` from the function dropdown → ▶ Run
 *  4. Authorize when prompted
 *  5. Click Deploy → New Deployment → Web App
 *       • Execute as: Me
 *       • Who has access: Anyone
 *     → Copy the Web App URL
 *  6. In Razorpay Dashboard → Settings → Webhooks → Add New Webhook
 *       • Webhook URL: paste the Web App URL
 *       • Secret: leave blank (or set one and update WEBHOOK_SECRET below)
 *       • Active Events: check "payment.captured"
 *     → Create Webhook
 *
 * ─── SHEET FORMAT ────────────────────────────────────────────────────
 *  Row 1 (Headers): Payment_id | Amount | Currency | Status | Date
 *  Row 2+:          pay_xxx... | 500.00 | INR      | captured| ...
 *  Last Row:        Total Amount | 37023.00 | INR  |         |
 * ─────────────────────────────────────────────────────────────────────
 *
 * @version 2.0.0
 */

// ─────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────

/** Name of the sheet tab to work on */
var SHEET_NAME = "Sheet1";

/** Label used in column A for the total row */
var TOTAL_LABEL = "Total Amount";

/** Column indices (1-based) */
var COL_PAYMENT_ID = 1; // A — Payment_id
var COL_AMOUNT     = 2; // B — Amount
var COL_CURRENCY   = 3; // C — Currency
var COL_STATUS     = 4; // D — Status
var COL_DATE       = 5; // E — Date

/** Only payments with this status are summed */
var CAPTURED_STATUS = "captured";

/**
 * Payment Page / Button IDs to track.
 * Only payments from these specific pages/buttons will be
 * added to the sheet. Find these IDs in your Razorpay Dashboard
 * under Payment Pages → [page] → Payment Page ID
 * or Payment Button → [button] → Button ID.
 *
 * Set to an empty array [] to accept ALL payments (no filtering).
 */
var PAYMENT_PAGE_IDS = [
  "pl_SGOFVKHOtSiWVO",  // Walking Project Fundraise! (Payment Page - latest)
  "pl_RJlXHVotmZ3Lnv",  // Contribute ₹365 (Payment Button)
  // Add more IDs here if needed:
  // "pl_xxxxxxxxxxxxx",
];

/**
 * Optional: Razorpay Webhook Secret for signature verification.
 * Set this if you configure a secret in Razorpay Dashboard → Webhooks.
 * Leave empty ("") to skip verification (fine for basic setups).
 */
var WEBHOOK_SECRET = "";

/**
 * ─── RAZORPAY API CREDENTIALS ─────────────────────────────────────
 * Required ONLY for the one-time `fetchMissingPayments` function.
 * Find these in: Razorpay Dashboard → Account & Settings → API Keys
 *
 * ⚠️  IMPORTANT: After running the fetch, you can delete these
 *     values for security. The webhook does NOT need them.
 */
var RAZORPAY_KEY_ID     = "rzp_live_SGSsgwqSAudshv";  // e.g. "rzp_live_xxxxxxxxxxxxxxx"
var RAZORPAY_KEY_SECRET = "200HQAGSqXoVgnTVvQj0fD24";  // e.g. "xxxxxxxxxxxxxxxxxxxxxxxxx"

// ─────────────────────────────────────────────
// One-Time Razorpay API Fetch
// ─────────────────────────────────────────────

/**
 * fetchMissingPayments — Pull all captured payments from Razorpay API
 * and insert any that are missing from the sheet.
 *
 * ▶ Run this ONCE from the Apps Script editor to backfill payments
 *   that happened before the webhook was set up.
 *
 * Prerequisites:
 *   1. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET above
 *   2. Select this function from the dropdown → ▶ Run
 *   3. Authorize if prompted
 */
function fetchMissingPayments() {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      "Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the script first!",
      "❌ Missing API Keys",
      5
    );
    Logger.log("ERROR: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set.");
    return;
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    Logger.log("Sheet '" + SHEET_NAME + "' not found.");
    return;
  }

  var authHeader = "Basic " + Utilities.base64Encode(RAZORPAY_KEY_ID + ":" + RAZORPAY_KEY_SECRET);

  // ── Step 1: Resolve payment page/button IDs ──
  var matchingPageIds = null;

  if (PAYMENT_PAGE_IDS && PAYMENT_PAGE_IDS.length > 0) {
    matchingPageIds = PAYMENT_PAGE_IDS;
    Logger.log("Step 1: Using " + matchingPageIds.length + " configured payment page/button ID(s):");
    for (var pi = 0; pi < matchingPageIds.length; pi++) {
      Logger.log("  • " + matchingPageIds[pi]);
    }
  } else {
    Logger.log("Step 1: No PAYMENT_PAGE_IDS configured — will fetch ALL payments.");
  }

  // ── Step 2: Collect order IDs from matching payment pages ──
  var targetOrderIds = {}; // Set of order_ids belonging to our pages
  var useOrderFilter = false;

  if (matchingPageIds !== null && matchingPageIds.length > 0) {
    Logger.log("Step 2: Collecting order IDs from " + matchingPageIds.length + " payment page(s)...");

    for (var m = 0; m < matchingPageIds.length; m++) {
      var detailUrl = "https://api.razorpay.com/v1/payment_pages/" + matchingPageIds[m];
      var detailResp = UrlFetchApp.fetch(detailUrl, {
        method: "get",
        headers: { "Authorization": authHeader },
        muteHttpExceptions: true
      });

      if (detailResp.getResponseCode() === 200) {
        var pageDetail = JSON.parse(detailResp.getContentText());
        Logger.log("  Page '" + (pageDetail.title || matchingPageIds[m]) + "': " +
                   (pageDetail.payments ? pageDetail.payments.count || 0 : "?") + " payments recorded");

        // Collect order IDs from payments.items if available
        if (pageDetail.payments && pageDetail.payments.items) {
          for (var pi2 = 0; pi2 < pageDetail.payments.items.length; pi2++) {
            var ppItem = pageDetail.payments.items[pi2];
            if (ppItem.order_id) targetOrderIds[ppItem.order_id] = true;
            if (ppItem.payment_id) targetOrderIds["pid:" + ppItem.payment_id] = true;
          }
          useOrderFilter = true;
        }
      } else {
        Logger.log("  ⚠ Could not fetch details for page " + matchingPageIds[m]);
      }
    }

    Logger.log("Collected " + Object.keys(targetOrderIds).length + " order/payment references.");
  }

  // ── Step 3: Collect existing Payment IDs for dedup ──
  var existingIds = {};
  var lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    var idColumn = sheet.getRange(2, COL_PAYMENT_ID, lastRow - 1, 1).getValues();
    for (var i = 0; i < idColumn.length; i++) {
      var id = (idColumn[i][0] || "").toString().trim();
      if (id) existingIds[id] = true;
    }
  }

  // ── Step 4: Fetch ALL payments from Razorpay (paginated) ──
  Logger.log("Step 3: Fetching all payments from Razorpay API...");
  var allPayments = [];
  var skip = 0;
  var count = 100;
  var hasMore = true;

  while (hasMore) {
    var url = "https://api.razorpay.com/v1/payments?count=" + count + "&skip=" + skip;
    var response = UrlFetchApp.fetch(url, {
      method: "get",
      headers: { "Authorization": authHeader },
      muteHttpExceptions: true
    });

    if (response.getResponseCode() !== 200) {
      Logger.log("API Error (" + response.getResponseCode() + "): " + response.getContentText());
      SpreadsheetApp.getActiveSpreadsheet().toast(
        "Razorpay API error: " + response.getResponseCode() + ". Check API keys.",
        "❌ API Error",
        5
      );
      return;
    }

    var json = JSON.parse(response.getContentText());
    var items = json.items || [];
    allPayments = allPayments.concat(items);
    Logger.log("  Fetched " + items.length + " payments (skip=" + skip + ")");

    if (items.length < count) {
      hasMore = false;
    } else {
      skip += count;
    }

    if (skip > 10000) {
      Logger.log("Safety limit reached (10,000 payments). Stopping.");
      hasMore = false;
    }
  }

  Logger.log("Total payments fetched: " + allPayments.length);

  // ── Step 5: Filter payments ──
  var newPayments = [];
  var skippedNonCaptured = 0;
  var skippedWrongPage = 0;

  for (var p = 0; p < allPayments.length; p++) {
    var payment = allPayments[p];

    // Skip non-captured payments
    if ((payment.status || "").toLowerCase() !== CAPTURED_STATUS.toLowerCase()) {
      skippedNonCaptured++;
      continue;
    }

    // Filter by payment page (using order_id matching)
    if (useOrderFilter) {
      var orderId = payment.order_id || "";
      var payId = payment.id || "";
      if (!targetOrderIds[orderId] && !targetOrderIds["pid:" + payId]) {
        skippedWrongPage++;
        continue;
      }
    }

    // Skip duplicates
    if (!existingIds[payment.id]) {
      newPayments.push(payment);
    }
  }

  Logger.log(
    "New payments to add: " + newPayments.length +
    " (skipped " + skippedNonCaptured + " non-captured" +
    ", " + skippedWrongPage + " wrong page)"
  );

  if (newPayments.length === 0) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      "No new payments found — sheet is already up to date!",
      "✅ All Synced",
      3
    );
    return;
  }

  // ── Sort by created_at (oldest first) ──
  newPayments.sort(function(a, b) {
    return (a.created_at || 0) - (b.created_at || 0);
  });

  // ── Find Total Amount row position ──
  lastRow = sheet.getLastRow();
  var totalRowIdx = -1;
  if (lastRow >= 2) {
    var payIds = sheet.getRange(2, COL_PAYMENT_ID, lastRow - 1, 1).getValues();
    for (var t = 0; t < payIds.length; t++) {
      if ((payIds[t][0] || "").toString().trim().toLowerCase() === TOTAL_LABEL.toLowerCase()) {
        totalRowIdx = t + 2;
        break;
      }
    }
  }

  // ── Insert new payment rows ──
  var inserted = 0;
  for (var n = 0; n < newPayments.length; n++) {
    var pay = newPayments[n];

    var paymentId = pay.id || "";
    var amountInRupees = (pay.amount || 0) / 100;
    var currency = pay.currency || "INR";
    var status = pay.status || "";
    var dateObj = new Date((pay.created_at || 0) * 1000);
    var formattedDate = Utilities.formatDate(
      dateObj,
      Session.getScriptTimeZone(),
      "dd/MM/yyyy HH:mm:ss"
    );

    var insertAt;
    if (totalRowIdx > 0) {
      insertAt = totalRowIdx;
      sheet.insertRowBefore(insertAt);
      totalRowIdx++;
    } else {
      insertAt = sheet.getLastRow() + 1;
    }

    var rowData = [paymentId, amountInRupees, currency, status, formattedDate];
    sheet.getRange(insertAt, 1, 1, rowData.length).setValues([rowData]);
    sheet.getRange(insertAt, COL_AMOUNT).setNumberFormat("#,##0.00");

    inserted++;
    Logger.log("  Added: " + paymentId + " | ₹" + amountInRupees + " | " + status + " | " + formattedDate);
  }

  // ── Recalculate total ──
  updateTotalAmount();

  var message = "✅ Added " + inserted + " new payment(s) to the sheet!";
  Logger.log(message);
  SpreadsheetApp.getActiveSpreadsheet().toast(message, "Razorpay Sync", 5);
}

// ─────────────────────────────────────────────
// Razorpay Webhook Handler
// ─────────────────────────────────────────────

/**
 * doPost — receives Razorpay webhook events.
 *
 * Razorpay sends a POST request with JSON payload whenever
 * a payment event occurs. This function:
 *   1. Parses the payment data from the webhook
 *   2. Checks if the payment already exists (dedup)
 *   3. Inserts a new row above the Total Amount row
 *   4. Recalculates the total
 *
 * NOTE: Page-level filtering is NOT possible in webhooks because
 * Razorpay doesn't include payment page/button IDs in webhook payloads.
 * To limit which payments trigger webhooks, configure the webhook
 * in Razorpay Dashboard to only fire for specific events.
 *
 * @param {Object} e — the POST event object from Google Apps Script
 * @returns {ContentService.TextOutput} — JSON response
 */
function doPost(e) {
  try {
    // Parse the incoming webhook payload
    var payload = JSON.parse(e.postData.contents);
    
    // Log the event for debugging
    Logger.log("Webhook received: " + payload.event);
    
    // Only handle payment.captured events
    if (payload.event !== "payment.captured") {
      return ContentService.createTextOutput(
        JSON.stringify({ status: "ignored", reason: "Not a payment.captured event" })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Extract payment data from the Razorpay payload
    var payment = payload.payload.payment.entity;
    
    var paymentId = payment.id || "";
    // Razorpay sends amount in PAISE (smallest currency unit)
    // Divide by 100 to get the amount in rupees
    var amountInRupees = (payment.amount || 0) / 100;
    var currency = payment.currency || "INR";
    var status = payment.status || "captured";
    
    // Format the date from UNIX timestamp
    var createdAt = payment.created_at || 0;
    var dateObj = new Date(createdAt * 1000); // Convert UNIX seconds to ms
    var formattedDate = Utilities.formatDate(
      dateObj,
      Session.getScriptTimeZone(),
      "dd/MM/yyyy HH:mm:ss"
    );
    
    // Open the sheet
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      Logger.log("Sheet '" + SHEET_NAME + "' not found.");
      return ContentService.createTextOutput(
        JSON.stringify({ status: "error", reason: "Sheet not found" })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    // ── Deduplication: check if this payment already exists ──
    var lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      var existingIds = sheet.getRange(2, COL_PAYMENT_ID, lastRow - 1, 1).getValues();
      for (var i = 0; i < existingIds.length; i++) {
        if ((existingIds[i][0] || "").toString().trim() === paymentId) {
          Logger.log("Payment " + paymentId + " already exists. Skipping.");
          return ContentService.createTextOutput(
            JSON.stringify({ status: "skipped", reason: "Duplicate payment", paymentId: paymentId })
          ).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }
    
    // ── Find Total Amount row to insert ABOVE it ──
    var insertRow = lastRow + 1; // Default: after last row
    
    if (lastRow >= 2) {
      var allPaymentIds = sheet.getRange(2, COL_PAYMENT_ID, lastRow - 1, 1).getValues();
      for (var j = 0; j < allPaymentIds.length; j++) {
        var cellVal = (allPaymentIds[j][0] || "").toString().trim().toLowerCase();
        if (cellVal === TOTAL_LABEL.toLowerCase()) {
          insertRow = j + 2; // Insert at the Total Amount row's position (pushes it down)
          sheet.insertRowBefore(insertRow);
          break;
        }
      }
    }
    
    // ── Insert the new payment row ──
    var newRow = [paymentId, amountInRupees, currency, status, formattedDate];
    sheet.getRange(insertRow, 1, 1, newRow.length).setValues([newRow]);
    
    // Format the amount column
    sheet.getRange(insertRow, COL_AMOUNT).setNumberFormat("#,##0.00");
    
    Logger.log(
      "✅ Payment added: " + paymentId +
      " | ₹" + amountInRupees +
      " | " + status +
      " | " + formattedDate
    );
    
    // ── Recalculate total ──
    updateTotalAmount();
    
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "success",
        paymentId: paymentId,
        amount: amountInRupees,
        currency: currency
      })
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    Logger.log("Webhook error: " + err.toString());
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * doGet — simple health check endpoint.
 * Visit the Web App URL in a browser to verify it's working.
 */
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      status: "ok",
      message: "Razorpay Donation Webhook is active",
      sheet: SHEET_NAME,
      timestamp: new Date().toISOString()
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

// ─────────────────────────────────────────────
// Total Amount Calculator — runs on every edit
// ─────────────────────────────────────────────

/**
 * Recalculates the total of captured payments and updates
 * the "Total Amount" row at the bottom of the sheet.
 */
function updateTotalAmount(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    Logger.log("Sheet '" + SHEET_NAME + "' not found.");
    return;
  }
  
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  
  // ── Step 1: Find existing Total Amount row ──
  var totalRowIndex = -1;
  var dataRange = sheet.getRange(2, COL_PAYMENT_ID, lastRow - 1, 1).getValues();
  
  for (var i = 0; i < dataRange.length; i++) {
    var cellValue = (dataRange[i][0] || "").toString().trim();
    if (cellValue.toLowerCase() === TOTAL_LABEL.toLowerCase()) {
      totalRowIndex = i + 2;
      break;
    }
  }
  
  // ── Step 2: Calculate sum of captured payments ──
  var allData = sheet.getRange(2, 1, lastRow - 1, COL_DATE).getValues();
  var totalCaptured = 0;
  var paymentRowCount = 0;
  
  for (var j = 0; j < allData.length; j++) {
    var rowPaymentId = (allData[j][COL_PAYMENT_ID - 1] || "").toString().trim();
    var rowStatus    = (allData[j][COL_STATUS - 1] || "").toString().trim().toLowerCase();
    var rowAmount    = parseFloat((allData[j][COL_AMOUNT - 1] || "0").toString().replace(/[₹,\s]/g, ""));
    
    // Skip the total row itself and empty rows
    if (rowPaymentId.toLowerCase() === TOTAL_LABEL.toLowerCase()) continue;
    if (rowPaymentId === "" && rowAmount === 0) continue;
    
    paymentRowCount++;
    
    if (rowStatus === CAPTURED_STATUS.toLowerCase()) {
      if (!isNaN(rowAmount) && rowAmount > 0) {
        totalCaptured += rowAmount;
      }
    }
  }
  
  // ── Step 3: Ensure Total Amount row exists at the bottom ──
  var targetRow;
  
  if (totalRowIndex > 0) {
    var expectedRow = paymentRowCount + 2;
    
    if (totalRowIndex !== expectedRow) {
      sheet.deleteRow(totalRowIndex);
      lastRow = sheet.getLastRow();
      targetRow = lastRow + 1;
    } else {
      targetRow = totalRowIndex;
    }
  } else {
    lastRow = sheet.getLastRow();
    targetRow = lastRow + 1;
  }
  
  // ── Step 4: Write the Total Amount row ──
  var totalRow = [
    TOTAL_LABEL,
    Math.round(totalCaptured * 100) / 100,
    "INR",
    "",
    ""
  ];
  
  sheet.getRange(targetRow, 1, 1, totalRow.length).setValues([totalRow]);
  
  // ── Step 5: Format the Total Amount row ──
  var totalRange = sheet.getRange(targetRow, 1, 1, totalRow.length);
  totalRange.setFontWeight("bold");
  totalRange.setBackground("#FFF8E7");
  sheet.getRange(targetRow, COL_AMOUNT).setNumberFormat("#,##0.00");
  
  Logger.log(
    "Total Amount updated: ₹" + totalCaptured.toFixed(2) +
    " (" + paymentRowCount + " payment rows, row " + targetRow + ")"
  );
}

// ─────────────────────────────────────────────
// Trigger Setup — Run ONCE manually
// ─────────────────────────────────────────────

/**
 * Installs an edit trigger so updateTotalAmount runs automatically.
 * Run this function ONCE from the Apps Script editor (▶ button).
 */
function installTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "updateTotalAmount") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  
  ScriptApp.newTrigger("updateTotalAmount")
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onEdit()
    .create();
  
  Logger.log("✅ Trigger installed! The Total Amount row will now auto-update on every edit.");
  updateTotalAmount();
}

/**
 * Manually recalculate the total.
 */
function recalculateNow() {
  updateTotalAmount();
  SpreadsheetApp.getActiveSpreadsheet().toast(
    "Total Amount has been recalculated!",
    "✅ Done",
    3
  );
}

// ─────────────────────────────────────────────
// Test Webhook — Simulate a Razorpay event
// ─────────────────────────────────────────────

/**
 * Simulates a Razorpay payment.captured webhook event.
 * Run this from the Apps Script editor to test the doPost function
 * without needing a real Razorpay payment.
 */
function testWebhook() {
  var fakeEvent = {
    postData: {
      contents: JSON.stringify({
        event: "payment.captured",
        payload: {
          payment: {
            entity: {
              id: "pay_TEST_" + new Date().getTime(),
              amount: 100000,  // ₹1000.00 in paise
              currency: "INR",
              status: "captured",
              created_at: Math.floor(Date.now() / 1000),
              email: "test@example.com",
              contact: "+919876543210",
              method: "upi",
              description: "Walking Project Fundraise!"
            }
          }
        }
      })
    }
  };
  
  var result = doPost(fakeEvent);
  Logger.log("Test result: " + result.getContent());
  
  SpreadsheetApp.getActiveSpreadsheet().toast(
    "Test payment added! Check the sheet.",
    "🧪 Test Webhook",
    5
  );
}

// ─────────────────────────────────────────────
// Debug — Inspect payment fields
// ─────────────────────────────────────────────

/**
 * debugPaymentFields — Fetches the 5 most recent captured payments
 * and logs ALL their fields. Run this to see what Razorpay puts
 * in `description`, `notes`, etc. for your Payment Page payments.
 *
 * ▶ Run from dropdown → check Execution Log for output
 */
function debugPaymentFields() {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    Logger.log("ERROR: Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET first.");
    return;
  }

  var authHeader = "Basic " + Utilities.base64Encode(RAZORPAY_KEY_ID + ":" + RAZORPAY_KEY_SECRET);
  var url = "https://api.razorpay.com/v1/payments?count=5&skip=0";

  var response = UrlFetchApp.fetch(url, {
    method: "get",
    headers: { "Authorization": authHeader },
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    Logger.log("API Error: " + response.getContentText());
    return;
  }

  var json = JSON.parse(response.getContentText());
  var items = json.items || [];

  Logger.log("════════════════════════════════════════════");
  Logger.log("  DEBUG: Inspecting " + items.length + " recent payments");
  Logger.log("════════════════════════════════════════════");

  for (var i = 0; i < items.length; i++) {
    var p = items[i];
    Logger.log("");
    Logger.log("── Payment " + (i + 1) + " ──────────────────────");
    Logger.log("  id:          " + p.id);
    Logger.log("  amount:      ₹" + (p.amount / 100));
    Logger.log("  status:      " + p.status);
    Logger.log("  description: " + (p.description || "(empty)"));
    Logger.log("  method:      " + (p.method || "(empty)"));
    Logger.log("  email:       " + (p.email || "(empty)"));
    Logger.log("  invoice_id:  " + (p.invoice_id || "(empty)"));
    Logger.log("  order_id:    " + (p.order_id || "(empty)"));
    
    // Log all notes
    var notes = p.notes || {};
    var noteKeys = Object.keys(notes);
    if (noteKeys.length > 0) {
      Logger.log("  notes:");
      for (var n = 0; n < noteKeys.length; n++) {
        Logger.log("    " + noteKeys[n] + ": " + notes[noteKeys[n]]);
      }
    } else {
      Logger.log("  notes:       (empty)");
    }
    
    // Log any field that might contain "walking" or "fundraise"
    var fullJson = JSON.stringify(p);
    if (fullJson.toLowerCase().indexOf("walk") !== -1 || 
        fullJson.toLowerCase().indexOf("fundrais") !== -1) {
      Logger.log("  ✅ CONTAINS 'walk' or 'fundrais' somewhere in the data!");
    } else {
      Logger.log("  ❌ Does NOT contain 'walk' or 'fundrais' anywhere");
    }
  }

  Logger.log("");
  Logger.log("════════════════════════════════════════════");
  Logger.log("  Check above to see which field contains");
  Logger.log("  your payment page identifier.");
  Logger.log("════════════════════════════════════════════");
}
