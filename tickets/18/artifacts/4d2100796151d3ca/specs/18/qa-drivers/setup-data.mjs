import fs from 'fs';
import path from 'path';

const facilityId = 'ce4220e8-a57d-4408-a157-06f10610db86';
const patientId = '980a4a53-b583-4594-a4ff-1e3c20eaf1f3';
const encounterId = '43eb1794-6885-4ebd-a803-5794ff4ca04b';

// Get API headers
function getApiHeaders() {
  const authFile = path.resolve('tests/.auth/user.json');
  const storageState = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
  const localStorage = storageState.origins?.[0]?.localStorage ?? [];
  const tokenEntry = localStorage.find(item => item.name === 'care_access_token');
  if (!tokenEntry) throw new Error('No access token in auth storage state');
  return {
    'Authorization': `Bearer ${tokenEntry.value}`,
    'Content-Type': 'application/json',
  };
}

const apiUrl = process.env.REACT_CARE_API_URL || 'http://localhost:9000';
const headers = getApiHeaders();

// Create Activity Definition with multiple diagnostic report codes
const adSlug = `qa-multi-diag-${Date.now()}`;
const adResponse = await fetch(`${apiUrl}/api/v1/facility/${facilityId}/activity_definition/`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    slug_value: adSlug,
    title: `QA Multi Diagnostic Report Test ${Math.random().toString(36).substring(7)}`,
    status: 'active',
    classification: 'laboratory',
    kind: 'service_request',
    code: {
      code: '442564008',
      display: 'Evaluation of specimen',
      system: 'http://snomed.info/sct',
    },
    diagnostic_report_codes: [
      {
        code: '58410-2',
        display: 'Complete blood count',
        system: 'http://loinc.org',
      },
      {
        code: '57021-8',
        display: 'CBC W Auto Differential panel',
        system: 'http://loinc.org',
      },
      {
        code: '57023-4',
        display: 'Auto Differential panel',
        system: 'http://loinc.org',
      },
    ],
    facility: facilityId,
    specimen_requirements: [],
    charge_item_definitions: [],
    observation_result_requirements: [],
    locations: [],
    category: 'f-ce4220e8-a57d-4408-a157-06f10610db86-lab-tests-activity-definition',
    healthcare_service: null,
    body_site: null,
    description: 'Test activity definition with multiple diagnostic report codes',
    usage: '',
    derived_from_uri: null,
  }),
});

if (!adResponse.ok) {
  const error = await adResponse.text();
  throw new Error(`Failed to create Activity Definition: ${adResponse.status} - ${error}`);
}

const adData = await adResponse.json();
console.log(`Created Activity Definition: ${adData.slug}`);

// Create Service Request
const srResponse = await fetch(`${apiUrl}/api/v1/facility/${facilityId}/service_request/`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    title: `Multi-Code SR ${Math.random().toString(36).substring(7)}`,
    encounter: encounterId,
    activity_definition: adData.slug,
    priority: 'routine',
    status: 'active',
    intent: 'order',
    category: 'laboratory',
    code: {
      code: '442564008',
      display: 'Evaluation of specimen',
      system: 'http://snomed.info/sct',
    },
    requester: 'f3528304-0750-4d53-a291-b229dee7f6fd',
  }),
});

if (!srResponse.ok) {
  const error = await srResponse.text();
  throw new Error(`Failed to create Service Request: ${srResponse.status} - ${error}`);
}

const srData = await srResponse.json();
console.log(`Created Service Request: ${srData.id}`);

// Create Activity Definition WITHOUT diagnostic report codes for AC #5
const noCodesAdSlug = `qa-no-codes-${Date.now()}`;
const noCodesAdResponse = await fetch(`${apiUrl}/api/v1/facility/${facilityId}/activity_definition/`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    slug_value: noCodesAdSlug,
    title: `QA No Codes Test ${Math.random().toString(36).substring(7)}`,
    status: 'active',
    classification: 'laboratory',
    kind: 'service_request',
    code: {
      code: '442564008',
      display: 'Evaluation of specimen',
      system: 'http://snomed.info/sct',
    },
    diagnostic_report_codes: [],
    facility: facilityId,
    specimen_requirements: [],
    charge_item_definitions: [],
    observation_result_requirements: [],
    locations: [],
    category: 'f-ce4220e8-a57d-4408-a157-06f10610db86-lab-tests-activity-definition',
    healthcare_service: null,
    body_site: null,
    description: 'Test activity definition without diagnostic report codes',
    usage: '',
    derived_from_uri: null,
  }),
});

if (!noCodesAdResponse.ok) {
  const error = await noCodesAdResponse.text();
  throw new Error(`Failed to create no-codes Activity Definition: ${noCodesAdResponse.status} - ${error}`);
}

const noCodesAdData = await noCodesAdResponse.json();
console.log(`Created no-codes Activity Definition: ${noCodesAdData.slug}`);

// Create Service Request for no-codes AD
const noCodesSrResponse = await fetch(`${apiUrl}/api/v1/facility/${facilityId}/service_request/`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    title: `No-Codes SR ${Math.random().toString(36).substring(7)}`,
    encounter: encounterId,
    activity_definition: noCodesAdData.slug,
    priority: 'routine',
    status: 'active',
    intent: 'order',
    category: 'laboratory',
    code: {
      code: '442564008',
      display: 'Evaluation of specimen',
      system: 'http://snomed.info/sct',
    },
    requester: 'f3528304-0750-4d53-a291-b229dee7f6fd',
  }),
});

if (!noCodesSrResponse.ok) {
  const error = await noCodesSrResponse.text();
  throw new Error(`Failed to create no-codes Service Request: ${noCodesSrResponse.status} - ${error}`);
}

const noCodesSrData = await noCodesSrResponse.json();
console.log(`Created no-codes Service Request: ${noCodesSrData.id}`);

// Save IDs to a file for use by other drivers
const testData = {
  facilityId,
  patientId,
  encounterId,
  multiCodesSR: {
    adSlug: adData.slug,
    srId: srData.id,
  },
  noCodesSR: {
    adSlug: noCodesAdData.slug,
    srId: noCodesSrData.id,
  },
};

fs.writeFileSync('specs/18/qa-drivers/test-data.json', JSON.stringify(testData, null, 2));
console.log('Test data saved to specs/18/qa-drivers/test-data.json');
