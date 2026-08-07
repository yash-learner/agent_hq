import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const facilityId = 'a885ee22-5085-4585-96b8-0aeb2a313f37';
const patientId = 'cd88da57-393d-4890-945d-c50fedbd8714';
const encounterId = 'adbfd512-cecd-4d3e-983c-e679cfc0c25e';

// Get auth token from storage state
const authFile = path.resolve('tests/.auth/user.json');
const storageState = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
const localStorage = storageState.origins?.[0]?.localStorage ?? [];
const tokenEntry = localStorage.find(item => item.name === 'care_access_token');
if (!tokenEntry) throw new Error('No access token');
const token = tokenEntry.value;

const apiUrl = process.env.REACT_CARE_API_URL || 'http://localhost:9000';

console.log('Setting up test data...');
console.log('Facility ID:', facilityId);
console.log('Patient ID:', patientId);
console.log('Encounter ID:', encounterId);

// First, get a resource category for lab tests
const categoryResponse = await fetch(
  `${apiUrl}/api/v1/facility/${facilityId}/resource_category/`,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }
);

const categories = await categoryResponse.json();
console.log('Available categories:', JSON.stringify(categories, null, 2));

// Find a lab-related category or use the first one
const labCategory = categories.results?.find(c => 
  c.name?.toLowerCase().includes('lab') || 
  c.name?.toLowerCase().includes('test')
) || categories.results?.[0];

if (!labCategory) {
  console.error('No categories available. Cannot proceed.');
  process.exit(1);
}

console.log('Using category:', labCategory.name, '(ID:', labCategory.id, ')');

// Create Activity Definition with 3 diagnostic report codes
const timestamp = Date.now();
const activityDef = {
  title: `Multi-Code Diagnostic Test QA-16-${timestamp}`,
  slug_value: `multi-code-diagnostic-qa-16-${timestamp}`.substring(0, 25),
  status: 'active',
  description: 'Activity Definition for testing multiple diagnostic report codes',
  classification: 'laboratory',
  kind: 'service_request',
  code: {
    system: 'http://loinc.org',
    code: '2345-7',
    display: 'Glucose [Mass/volume] in Serum or Plasma'
  },
  diagnostic_report_codes: [
    {
      system: 'http://loinc.org',
      code: '58410-2',
      display: 'CBC panel - Blood by Automated count'
    },
    {
      system: 'http://loinc.org',
      code: '24331-1',
      display: 'Lipid panel - Serum or Plasma'
    },
    {
      system: 'http://loinc.org',
      code: '24323-8',
      display: 'Comprehensive metabolic 2000 panel - Serum or Plasma'
    }
  ],
  body_site: null,
  derived_from_uri: null,
  usage: '',
  facility: facilityId,
  specimen_requirements: [],
  charge_item_definitions: [],
  observation_result_requirements: [],
  locations: [],
  category: labCategory.id,
  healthcare_service: null
};

console.log('Creating Activity Definition...');
const adResponse = await fetch(
  `${apiUrl}/api/v1/facility/${facilityId}/activity_definition/`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(activityDef),
  }
);

if (!adResponse.ok) {
  const errorText = await adResponse.text();
  console.error('Failed to create Activity Definition:', errorText);
  process.exit(1);
}

const createdAD = await adResponse.json();
console.log('Activity Definition created:', createdAD.id);
console.log('Title:', createdAD.title);
console.log('Diagnostic report codes:', createdAD.diagnostic_report_codes?.length || 0);

// Save the AD ID for use in the test
fs.writeFileSync('.agent-hq/activity-definition-id.txt', createdAD.id);
console.log('Saved AD ID to .agent-hq/activity-definition-id.txt');

// Now create a Service Request using this Activity Definition
console.log('\nCreating Service Request...');

const serviceRequest = {
  activity: createdAD.id,
  priority: 'routine',
  category: 'laboratory',
  status: 'active',
};

const srResponse = await fetch(
  `${apiUrl}/api/v1/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/service_request/`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(serviceRequest),
  }
);

if (!srResponse.ok) {
  const errorText = await srResponse.text();
  console.error('Failed to create Service Request:', errorText);
  process.exit(1);
}

const createdSR = await srResponse.json();
console.log('Service Request created:', createdSR.id);
fs.writeFileSync('.agent-hq/service-request-id.txt', createdSR.id);
console.log('Saved SR ID to .agent-hq/service-request-id.txt');

console.log('\nTest data setup complete!');
console.log('Activity Definition ID:', createdAD.id);
console.log('Service Request ID:', createdSR.id);
