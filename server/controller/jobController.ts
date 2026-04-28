import Job from "../models/Job";
import fs from "fs";
import path from "path";

// Budget range keys matching the image
export type BudgetRange =
    | "100万円+"
    | "50万円~100万円"
    | "30万円~50万円"
    | "10万円~30万円"
    | "5万円~10万円"
    | "3万円"
    | "???"
    | "H: 5千円"
    | "H: 3千円~5千円"
    | "H: 1千円~3千円";

interface TimeIntervalRow {
    timeRange: string; // e.g., "0:00 ~ 0:30"
    budgetCounts: { [key in BudgetRange]?: number }; // value can be undefined if no job in that interval-budget
    sum: number; // Total jobs in this time interval
}

interface JobStatsCSV {
    date: string;
    budgetRanges: BudgetRange[];
    rows: TimeIntervalRow[];
    totalJobs: number;
}

/**
 * Get budget range for a job based on its budget values and job type
 */
function getBudgetRange(job: any): BudgetRange {
    const { lowBudget, highBudget, jobType } = job;

    // No budget case
    if (lowBudget === 0 && highBudget === 0) {
        return "???";
    }

    // For hourly jobs, use specific ranges
    if (jobType === 'hourly') {
        if (highBudget >= 3000 && highBudget < 5000) {
            return "H: 3千円~5千円";
        }
        if (highBudget >= 1000 && highBudget < 3000) {
            return "H: 1千円~3千円";
        }
        // If hourly but doesn't match above ranges, still categorize by highBudget
    }

    // Use highBudget for comparison (as per user requirement)
    if (highBudget > 1000000) {
        return "100万円+";
    }
    if (highBudget > 500000 && highBudget <= 1000000) {
        return "50万円~100万円";
    }
    if (highBudget > 300000 && highBudget <= 500000) {
        return "30万円~50万円";
    }
    if (highBudget > 100000 && highBudget <= 300000) {
        return "10万円~30万円";
    }
    if (highBudget > 50000 && highBudget <= 100000) {
        return "5万円~10万円";
    }
    if (highBudget <= 30000) {
        return "3万円";
    }
    if (highBudget <= 5000) {
        return "H: 5千円";
    }
    if (highBudget > 3000 && highBudget <= 5000) {
        return "H: 3千円~5千円";
    }
    if (highBudget > 1000 && highBudget <= 3000) {
        return "H: 1千円~3千円";
    }

    // Default fallback
    return "???";
}

/**
 * Get jobs for a specific date, organized in CSV-like structure
 * @param date - Date string in YYYY-MM-DD format
 */
export async function getJobsByDateCSV(date: string): Promise<JobStatsCSV> {
    try {
        // Parse the date
        const selectedDate = new Date(date);
        const start = new Date(selectedDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(selectedDate);
        end.setHours(23, 59, 59, 999);

        // Fetch all jobs for this date
        const jobs = await Job.find({
            createdAt: {
                $gte: start,
                $lte: end,
            },
        }).sort({ createdAt: 1 });

        // Define all budget ranges in order (matching image)
        const budgetRanges: BudgetRange[] = [
            "100万円+",
            "50万円~100万円",
            "30万円~50万円",
            "10万円~30万円",
            "5万円~10万円",
            "3万円",
            "???",
            "H: 5千円",
            "H: 3千円~5千円",
            "H: 1千円~3千円",
        ];

        // Initialize rows for all 30-minute intervals
        const rows: TimeIntervalRow[] = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const nextMinute = minute + 30;
                const nextHour = nextMinute >= 60 ? hour + 1 : hour;
                const intervalEndMinute = nextMinute >= 60 ? nextMinute - 60 : nextMinute;

                const timeRange = `${hour}:${String(minute).padStart(2, '0')} ~ ${nextHour}:${String(intervalEndMinute).padStart(2, '0')}`;

                // Notice: initialize as empty object, not with 0
                const budgetCounts: { [key in BudgetRange]?: number } = {};

                rows.push({
                    timeRange,
                    budgetCounts,
                    sum: 0,
                });
            }
        }

        // Process each job and assign to appropriate interval and budget range
        jobs.forEach((job: any) => {
            const jobDate = new Date(job.createdAt);
            const jobHour = jobDate.getHours();
            const jobMinute = jobDate.getMinutes();

            // Determine which 30-minute interval this job belongs to
            const intervalIndex = jobHour * 2 + (jobMinute >= 30 ? 1 : 0);

            if (intervalIndex < rows.length) {
                const budgetRange = getBudgetRange(job);
                if (!rows[intervalIndex].budgetCounts[budgetRange]) {
                    rows[intervalIndex].budgetCounts[budgetRange] = 0;
                }
                rows[intervalIndex].budgetCounts[budgetRange]!++;
                rows[intervalIndex].sum++;
            }
        });

        const result: JobStatsCSV = {
            date,
            budgetRanges,
            rows,
            totalJobs: jobs.length,
        };

        // Generate and save CSV file
        await saveCSVFile(result);

        return result;
    } catch (error: any) {
        console.error('Error getting jobs by date CSV:', error);
        throw new Error(error.message || 'Failed to get jobs by date CSV');
    }
}

/**
 * Generate and save CSV file from job statistics
 */
async function saveCSVFile(data: JobStatsCSV): Promise<void> {
    try {
        // Create CSV directory if it doesn't exist (server/data/csv)
        // Using process.cwd() assumes server is run from project root
        const csvDir = path.resolve(process.cwd(), 'server', 'data', 'csv');
        if (!fs.existsSync(csvDir)) {
            fs.mkdirSync(csvDir, { recursive: true });
        }

        // Generate CSV content
        const csvLines: string[] = [];

        // Header row: SUM, then budget ranges
        const headerRow = ['SUM', ...data.budgetRanges.map(range => {
            // Format budget ranges for CSV header (add commas for readability)
            if (range === '100万円+') return '100万円 +';
            if (range === '50万円~100万円') return '50万円~100万円';
            if (range === '30万円~50万円') return '30万円~50万円';
            if (range === '10万円~30万円') return '10万円~30万円';
            if (range === '5万円~10万円') return '5万円~10万円';
            if (range === '3万円') return '3万円';
            if (range === '???') return '???';
            if (range === 'H: 5千円') return 'H: 5千円';
            if (range === 'H: 3千円~5千円') return 'H: 3千円~5千円';
            if (range === 'H: 1千円~3千円') return 'H: 1千円~3千円';
            return range;
        })];
        csvLines.push(headerRow.join(','));

        // Data rows: time range, then counts for each budget range
        data.rows.forEach((row) => {
            // Prepare row. We'll push empty string for budgetCounts with undefined or 0 (so only when >0 it is set)
            const rowData: string[] = [row.timeRange];
            for (const range of data.budgetRanges) {
                const count = row.budgetCounts[range];
                // Only fill if count is defined and >0; otherwise leave empty
                if (typeof count === "number" && count > 0) {
                    rowData.push(count.toString());
                } else {
                    rowData.push("");
                }
            }
            csvLines.push(rowData.join(','));
        });

        // Join all lines with newlines
        const csvContent = csvLines.join('\n');

        // Generate filename: jobs_YYYY-MM-DD.csv
        const filename = `jobs_${data.date}.csv`;
        const filePath = path.join(csvDir, filename);

        // Write CSV file
        fs.writeFileSync(filePath, csvContent, 'utf-8');

        console.log(`CSV file saved: ${filePath}`);
    } catch (error: any) {
        console.error('Error saving CSV file:', error);
        // Don't throw error - CSV generation failure shouldn't break the API response
    }
}

const CSV_DIR = path.resolve(process.cwd(), 'server', 'data', 'csv');

/** Normalize date from filename to YYYY-MM-DD (handles jobs_2026-02-09.csv and jobs_2026.2.9.csv) */
function parseDateFromFilename(filename: string): string | null {
    const match = filename.match(/^jobs_(.+)\.csv$/i);
    if (!match) return null;
    const part = match[1];
    if (part.includes('-')) {
        const [y, m, d] = part.split('-').map(Number);
        if (!y || !m || !d) return null;
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    if (part.includes('.')) {
        const [y, m, d] = part.split('.').map(Number);
        if (!y || !m || !d) return null;
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    return null;
}

/**
 * List all dates that have a saved CSV file in server/data/csv (excluding subdirs like copied/)
 */
export async function listAvailableCSVDates(): Promise<string[]> {
    try {
        if (!fs.existsSync(CSV_DIR)) return [];
        const entries = fs.readdirSync(CSV_DIR, { withFileTypes: true });
        const dates: string[] = [];
        for (const e of entries) {
            if (!e.isFile() || !e.name.toLowerCase().endsWith('.csv')) continue;
            const date = parseDateFromFilename(e.name);
            if (date && !dates.includes(date)) dates.push(date);
        }
        dates.sort();
        return dates;
    } catch (err: any) {
        console.error('Error listing CSV dates:', err);
        return [];
    }
}

/**
 * Get absolute path to the CSV file for a given date (YYYY-MM-DD), or null if not found.
 * Handles both jobs_YYYY-MM-DD.csv and jobs_YYYY.M.D.csv naming.
 */
export function getCSVFilePathForDate(date: string): string | null {
    try {
        if (!fs.existsSync(CSV_DIR)) return null;
        const entries = fs.readdirSync(CSV_DIR, { withFileTypes: true });
        for (const e of entries) {
            if (!e.isFile() || !e.name.toLowerCase().endsWith('.csv')) continue;
            const d = parseDateFromFilename(e.name);
            if (d === date) return path.join(CSV_DIR, e.name);
        }
        return null;
    } catch (err: any) {
        console.error('Error resolving CSV path:', err);
        return null;
    }
}

/** Normalize CSV header to BudgetRange key (e.g. "100万円 +" -> "100万円+") */
function normalizeBudgetHeader(h: string): string {
    const t = h.trim();
    if (t === "100万円 +") return "100万円+";
    return t;
}

/**
 * Read job stats from a saved CSV file (same shape as getJobsByDateCSV).
 */
export function getJobsByDateFromCSVFile(date: string): JobStatsCSV | null {
    const filePath = getCSVFilePathForDate(date);
    if (!filePath) return null;
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split(/\r?\n/).filter(Boolean);
        if (lines.length < 2) return null;
        const headerRow = lines[0].split(',');
        const budgetRanges: BudgetRange[] = headerRow.slice(1).map((h) => normalizeBudgetHeader(h) as BudgetRange);
        const rows: TimeIntervalRow[] = [];
        let totalJobs = 0;
        for (let i = 1; i < lines.length; i++) {
            const cells = lines[i].split(',');
            const timeRange = cells[0]?.trim() || '';
            const budgetCounts: { [key in BudgetRange]?: number } = {};
            let sum = 0;
            for (let c = 0; c < budgetRanges.length; c++) {
                const val = cells[c + 1]?.trim();
                const num = val ? parseInt(val, 10) : 0;
                if (!isNaN(num) && num > 0) {
                    budgetCounts[budgetRanges[c]] = num;
                    sum += num;
                }
            }
            rows.push({ timeRange, budgetCounts, sum });
            totalJobs += sum;
        }
        return { date, budgetRanges, rows, totalJobs };
    } catch (err: any) {
        console.error('Error reading CSV file:', err);
        return null;
    }
}

/**
 * Get date range [start, end] for period (today, this_week, this_month, custom).
 */
function getPeriodDateRange(period: string, startDate?: string, endDate?: string): { start: Date; end: Date } {
    const now = new Date();
    let start: Date;
    let end: Date = new Date(now);
    end.setHours(23, 59, 59, 999);

    switch (period) {
        case 'today':
            start = new Date(now);
            start.setHours(0, 0, 0, 0);
            break;
        case 'this_week':
            start = new Date(now);
            const dayOfWeek = start.getDay();
            const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            start.setDate(diff);
            start.setHours(0, 0, 0, 0);
            break;
        case 'this_month':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            start.setHours(0, 0, 0, 0);
            break;
        case 'custom':
            if (!startDate || !endDate) throw new Error('Start date and end date required for custom period');
            start = new Date(startDate);
            end = new Date(endDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        default:
            start = new Date(now);
            start.setHours(0, 0, 0, 0);
    }
    return { start, end };
}

/**
 * Get jobs aggregated by period (today, this week, this month, custom range) in CSV-like structure.
 */
export async function getJobsByPeriodCSV(
    period: string = 'today',
    startDate?: string,
    endDate?: string
): Promise<JobStatsCSV> {
    const budgetRanges: BudgetRange[] = [
        "100万円+", "50万円~100万円", "30万円~50万円", "10万円~30万円",
        "5万円~10万円", "3万円", "???", "H: 5千円", "H: 3千円~5千円", "H: 1千円~3千円",
    ];
    const { start, end } = getPeriodDateRange(period, startDate, endDate);
    const jobs = await Job.find({
        createdAt: { $gte: start, $lte: end },
    }).sort({ createdAt: 1 });

    const rows: TimeIntervalRow[] = [];
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const nextMinute = minute + 30;
            const nextHour = nextMinute >= 60 ? hour + 1 : hour;
            const intervalEndMinute = nextMinute >= 60 ? nextMinute - 60 : nextMinute;
            const timeRange = `${hour}:${String(minute).padStart(2, '0')} ~ ${nextHour}:${String(intervalEndMinute).padStart(2, '0')}`;
            const budgetCounts: { [key in BudgetRange]?: number } = {};
            rows.push({ timeRange, budgetCounts, sum: 0 });
        }
    }

    jobs.forEach((job: any) => {
        const jobDate = new Date(job.createdAt);
        const intervalIndex = jobDate.getHours() * 2 + (jobDate.getMinutes() >= 30 ? 1 : 0);
        if (intervalIndex < rows.length) {
            const budgetRange = getBudgetRange(job);
            if (!rows[intervalIndex].budgetCounts[budgetRange]) rows[intervalIndex].budgetCounts[budgetRange] = 0;
            rows[intervalIndex].budgetCounts[budgetRange]!++;
            rows[intervalIndex].sum++;
        }
    });

    const dateLabel = period === 'custom' && startDate && endDate
        ? `${startDate} ~ ${endDate}`
        : `${start.toISOString().slice(0, 10)} ~ ${end.toISOString().slice(0, 10)}`;
    return { date: dateLabel, budgetRanges, rows, totalJobs: jobs.length };
}

interface ClientJobSummary {
    clientId: number;
    clientName: string;
    clientAvatar?: string;
    jobCount: number;
    jobs: {
        id: number;
        title: string;
        jobType: string;
        lowBudget: number;
        highBudget: number;
        createdAt: string;
        budgetRange: BudgetRange;
    }[];
}

function getIntervalIndex(date: Date): number {
    const hour = date.getHours();
    const minute = date.getMinutes();
    return hour * 2 + (minute >= 30 ? 1 : 0);
}

function parseTimeRangeToIndex(timeRange: string | undefined): number | null {
    if (!timeRange) return null;
    const match = timeRange.match(/(\d+):(\d+)\s*~/);
    if (!match) return null;
    const hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    if (isNaN(hour) || isNaN(minute)) return null;
    return hour * 2 + (minute >= 30 ? 1 : 0);
}

/**
 * Get list of clients (and their jobs) for a specific graph segment
 * filtered by timeRange and/or budgetRange over a single day or period.
 */
export async function getClientsByGraphFilter(options: {
    scope: 'single_day' | 'period';
    date?: string;
    period?: string;
    startDate?: string;
    endDate?: string;
    timeRange?: string;
    budgetRange?: string;
}): Promise<{ totalJobs: number; clients: ClientJobSummary[] }> {
    let start: Date;
    let end: Date;

    if (options.scope === 'single_day') {
        if (!options.date) {
            throw new Error('date is required for single_day scope');
        }
        const d = new Date(options.date);
        start = new Date(d);
        start.setHours(0, 0, 0, 0);
        end = new Date(d);
        end.setHours(23, 59, 59, 999);
    } else {
        const { start: s, end: e } = getPeriodDateRange(
            options.period || 'today',
            options.startDate,
            options.endDate
        );
        start = s;
        end = e;
    }

    const jobs = await Job.find({
        createdAt: { $gte: start, $lte: end },
    }).sort({ createdAt: 1 });

    const targetIntervalIndex = parseTimeRangeToIndex(options.timeRange);
    const targetBudgetRange = options.budgetRange as BudgetRange | undefined;

    const filtered = jobs.filter((job: any) => {
        const created = new Date(job.createdAt);
        if (targetIntervalIndex !== null) {
            const idx = getIntervalIndex(created);
            if (idx !== targetIntervalIndex) return false;
        }
        if (targetBudgetRange) {
            const br = getBudgetRange(job);
            if (br !== targetBudgetRange) return false;
        }
        return true;
    });

    const clientMap = new Map<number, ClientJobSummary>();

    filtered.forEach((job: any) => {
        const rawId = typeof job.clientId === 'number' ? job.clientId : Number(job.clientId || 0);
        const clientId = isNaN(rawId) ? 0 : rawId;
        const budgetRange = getBudgetRange(job);
        const createdAtStr = new Date(job.createdAt).toISOString();

        if (!clientMap.has(clientId)) {
            clientMap.set(clientId, {
                clientId,
                clientName: job.clientName || 'Unknown client',
                clientAvatar: job.clientAvatar,
                jobCount: 0,
                jobs: [],
            });
        }

        const summary = clientMap.get(clientId)!;
        summary.jobCount += 1;
        summary.jobs.push({
            id: job.id,
            title: job.title,
            jobType: job.jobType,
            lowBudget: job.lowBudget,
            highBudget: job.highBudget,
            createdAt: createdAtStr,
            budgetRange,
        });
    });

    const clients = Array.from(clientMap.values()).sort((a, b) => b.jobCount - a.jobCount);
    return { totalJobs: filtered.length, clients };
}

/**
 * Get all jobs for a specific time period (without interval grouping)
 */
export async function getJobsByPeriod(
    period: string = 'today',
    startDate?: string,
    endDate?: string
): Promise<any[]> {
    try {
        const now = new Date();
        let start: Date;
        let end: Date = new Date(now);

        switch (period) {
            case 'today':
                start = new Date(now);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'this_week':
                start = new Date(now);
                const dayOfWeek = start.getDay();
                const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                start.setDate(diff);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'last_week':
                start = new Date(now);
                const lastWeekDay = start.getDay();
                const lastWeekDiff = start.getDate() - lastWeekDay - 6;
                start.setDate(lastWeekDiff);
                start.setHours(0, 0, 0, 0);
                end = new Date(start);
                end.setDate(end.getDate() + 6);
                end.setHours(23, 59, 59, 999);
                break;
            case 'this_month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                start.setHours(0, 0, 0, 0);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'last_month':
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                start.setHours(0, 0, 0, 0);
                end = new Date(now.getFullYear(), now.getMonth(), 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'custom':
                if (!startDate || !endDate) {
                    throw new Error('Start date and end date are required for custom period');
                }
                start = new Date(startDate);
                end = new Date(endDate);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            default:
                start = new Date(now);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
        }

        const jobs = await Job.find({
            createdAt: {
                $gte: start,
                $lte: end,
            },
        }).sort({ createdAt: -1 });

        return jobs.map((job: any) => ({
            id: job.id,
            title: job.title,
            categoryId: job.categoryId,
            desc: job.desc,
            jobType: job.jobType,
            lowBudget: job.lowBudget,
            highBudget: job.highBudget,
            suggestions: job.suggestions,
            deadline: job.deadline,
            postedDate: job.postedDate,
            clientId: job.clientId,
            clientName: job.clientName,
            clientAvatar: job.clientAvatar,
            bidders: job.bidders,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt,
        }));
    } catch (error: any) {
        console.error('Error getting jobs by period:', error);
        throw new Error(error.message || 'Failed to get jobs by period');
    }
}
