import { ApiResponse, Patient } from '../types/patient';

const API_ROOT = process.env.API_BASE_URL || 'https://assessment.ksensetech.com/api';
const AUTH_KEY = process.env.API_KEY;

if (!AUTH_KEY) {
  throw new Error('API_KEY environment variable is required');
}

// Type assertion since we've validated AUTH_KEY is not undefined
const API_KEY: string = AUTH_KEY; 
const RETRY_LIMIT = 3;
const BASE_DELAY = 1000; 
const THROTTLE_WAIT = 2000; 

//  pause execution
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function getPageData(
  page: number, 
  size: number = 5, 
  attempt: number = 0
): Promise<ApiResponse> {
  try {
    const endpoint = `${API_ROOT}/patients?page=${page}&limit=${size}`;
    const res = await fetch(endpoint, {
      headers: { 'x-api-key': API_KEY }
    });

    if (res.status === 429) {
      console.warn(`[Page ${page}] Rate limit hit. Waiting ${THROTTLE_WAIT}ms...`);
      await delay(THROTTLE_WAIT);
      return getPageData(page, size, attempt); // Try again
    }

    if (res.status === 500 || res.status === 503) {
      if (attempt < RETRY_LIMIT) {
        const backoff = BASE_DELAY * (attempt + 1);
        console.log(`[Page ${page}] Server error (${res.status}). Retrying in ${backoff}ms...`);
        await delay(backoff);
        return getPageData(page, size, attempt + 1);
      }
      throw new Error(`Server failed on page ${page} after ${RETRY_LIMIT} tries.`);
    }

    if (!res.ok) throw new Error(`Fetch failed with status: ${res.status}`);

    return (await res.json()) as ApiResponse;

  } catch (err) {
    if (attempt < RETRY_LIMIT && (err instanceof TypeError || err instanceof Error)) {
      const backoff = BASE_DELAY * (attempt + 1);
      console.log(`[Page ${page}] Network issue. Retrying (Attempt ${attempt + 1})...`);
      await delay(backoff);
      return getPageData(page, size, attempt + 1);
    }
    throw err;
  }
}

export const fetchAllPatients = async (pageSize: number = 20): Promise<Patient[]> => {
  const results: Patient[] = [];
  let page = 1;
  let keepFetching = true;
  let totalPageCount: number | null = null;

  console.log('--- Starting Patient Data Sync ---');

  while (keepFetching) {
    try {
      if (page > 1) await delay(500);
      const response = await getPageData(page, pageSize);
      if (!response.data || !Array.isArray(response.data)) {
        console.error(`Page ${page} returned bad data format. Skipping.`);
        page++;
        continue;
      }

      results.push(...response.data);
      if (response.pagination) {
        keepFetching = response.pagination.hasNext ?? false;
        totalPageCount = response.pagination.totalPages ?? null;
      } else {
        keepFetching = response.data.length === pageSize;
      }

      console.log(`Progress: Page ${page}/${totalPageCount || '?'} collected.`);
      page++;

      // Emergency stop to prevent infinite loops
      if (page > 50) { 
        console.warn('Safety limit reached 50 pages.');
        break; 
      }

    } catch (error) {
      console.error(`Failed to load page ${page}:`, error);
      page++; // Try to skip the broken page and continue
    }
  }

  console.log(`Sync Complete. Found ${results.length} total patients.\n`);
  return results;
};