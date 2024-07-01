// SeparatePlays/test/separatePlays.test.js
const {
    findWeekForTimestamp,
    getUTCForPastWeek,
    sanitizePastWeeksPlaysMap,
} = require('../routes/separatePlays');
const NUM_OF_WEEKS_TO_SAVE_RECENT_PLAYS = require("../__mocks__/constants");

jest.mock('../constants');

// findWeekForTimestamp(timestamp)
test('Find the week for timestamp within the current week', () => {
    jest.useFakeTimers('modern');
    const mockDate = new Date('2024-06-01T01:04:45.522Z');
    jest.setSystemTime(mockDate);

    let timestamp = '2024-06-01T01:04:45.522Z';
    expect(findWeekForTimestamp(timestamp)).toBe('2024-05-26T00:00:00.000Z');

    jest.useRealTimers();
});

test('Find the week for timestamp from the previous week', () => {
    jest.useFakeTimers('modern');
    const mockDate = new Date('2024-06-01T01:04:45.522Z');
    jest.setSystemTime(mockDate);

    let timestamp = '2024-05-23T18:04:52.000Z';
    expect(findWeekForTimestamp(timestamp)).toBe('2024-05-19T00:00:00.000Z');

    jest.useRealTimers();
});

test('Find the week for timestamp from a few weeks ago', () => {
    jest.useFakeTimers('modern');
    const mockDate = new Date('2024-06-01T01:04:45.522Z');
    jest.setSystemTime(mockDate);

    let timestamp = '2024-05-02T03:02:14.000Z';
    expect(findWeekForTimestamp(timestamp)).toBe('2024-04-28T00:00:00.000Z');

    jest.useRealTimers();
});

test('Find the week for timestamp from a too many weeks ago', () => {
    jest.useFakeTimers('modern');
    const mockDate = new Date('2024-06-01T01:04:45.522Z');
    jest.setSystemTime(mockDate);

    // Create a time that is too many weeks ago
    const milisecsInDay = 86400000;
    let timestamp = new Date();
    timestamp = timestamp.getTime() - (NUM_OF_WEEKS_TO_SAVE_RECENT_PLAYS + 1) * 7 * milisecsInDay;

    expect(findWeekForTimestamp(timestamp)).toBe(-1);

    jest.useRealTimers();
});


// getUTCForPastWeek(numOfWeeksAgo = 0, weekdayOffset = 0)
test('Today is Saturday, get the UTC timestamp for the most recent Sunday', () => {
    jest.useFakeTimers('modern');

    // Set the time to be June 1st, 2024, 4:45AM
    const mockDate = new Date('2024-06-01T01:04:45.522Z');
    jest.setSystemTime(mockDate);

    expect(getUTCForPastWeek()).toBe(1716681600000);

    jest.useRealTimers();
});

test('Today is Saturday, get the UTC timestamp for the most recent Monday', () => {
    jest.useFakeTimers('modern');

    // Set the time to be June 1st, 2024, 4:45AM
    const mockDate = new Date('2024-06-01T01:04:45.522Z');
    jest.setSystemTime(mockDate);

    expect(getUTCForPastWeek(0, 1)).toBe(1716768000000);

    jest.useRealTimers();
});

test('Today is Saturday, get the UTC timestamp for the most recent Saturday', () => {
    jest.useFakeTimers('modern');

    // Set the time to be June 1st, 2024, 4:45AM
    const mockDate = new Date('2024-06-01T01:04:45.522Z');
    jest.setSystemTime(mockDate);

    expect(getUTCForPastWeek(0, 6)).toBe(1717200000000);

    jest.useRealTimers();
});

test('Today is Saturday, get the UTC timestamp for the Saturday last week', () => {
    jest.useFakeTimers('modern');

    // Set the time to be June 1st, 2024, 4:45AM
    const mockDate = new Date('2024-06-01T01:04:45.522Z');
    jest.setSystemTime(mockDate);

    expect(getUTCForPastWeek(1, 6)).toBe(1716595200000);

    jest.useRealTimers();
});

test('Today is Saturday, get the UTC timestamp for the Saturday two weeks ago', () => {
    jest.useFakeTimers('modern');

    // Set the time to be June 1st, 2024, 4:45AM
    const mockDate = new Date('2024-06-01T01:04:45.522Z');
    jest.setSystemTime(mockDate);

    expect(getUTCForPastWeek(2, 6)).toBe(1715990400000);

    jest.useRealTimers();
});

// sanitizePastWeeksPlaysMap(pastWeeksPlays)
test('After sanitizing an empty pastWeeksPlays map, ', () => {
    const pastWeeksPlays = new Map();
    sanitizePastWeeksPlaysMap(pastWeeksPlays);
    expect(pastWeeksPlays.size).toBe(NUM_OF_WEEKS_TO_SAVE_RECENT_PLAYS);
});

test('After sanitizing pastWeeksPlays map with timestamps that are too old,  ', () => {
    jest.useFakeTimers('modern');

    // Set the time to be June 1st, 2024, 4:45AM
    const mockDate = new Date('2024-06-01T01:04:45.522Z');
    jest.setSystemTime(mockDate);

    const pastWeeksPlays = new Map();
    const tooOldTimestamp1 = '2024-02-25T00:00:00.000Z'; // 1 week too old
    const tooOldTimestamp2 = '2024-03-02T23:59:59.000Z'; // 1 second too old
    const currentTimestamp = '2024-03-17T00:00:00.000Z'; // within the number of weeks to save
    pastWeeksPlays.set(tooOldTimestamp1, new Map());
    pastWeeksPlays.set(tooOldTimestamp2, new Map());

    sanitizePastWeeksPlaysMap(pastWeeksPlays);

    expect(pastWeeksPlays.has(tooOldTimestamp1)).toBe(false);
    expect(pastWeeksPlays.has(tooOldTimestamp2)).toBe(false);
    expect(pastWeeksPlays.has(currentTimestamp)).toBe(true);

    jest.useRealTimers();
});

test('After sanitizing pastWeeksPlays map,  ', () => {
    jest.useFakeTimers('modern');

    // Set the time to be June 1st, 2024, 4:45AM
    const mockDate = new Date('2024-06-01T01:04:45.522Z');
    jest.setSystemTime(mockDate);

    const pastWeeksPlays = new Map();

    sanitizePastWeeksPlaysMap(pastWeeksPlays);

    const t1 = '2024-05-19T00:00:00.000Z'; // most recent week
    const t2 = '2024-04-14T00:00:00.000Z'; // week in the middle
    const t3 = '2024-03-03T00:00:00.000Z'; // oldest week
    expect(pastWeeksPlays.has(t1)).toBe(true);
    expect(pastWeeksPlays.has(t2)).toBe(true);
    expect(pastWeeksPlays.has(t3)).toBe(true);

    jest.useRealTimers();
});

// bucketTimestamps(recentPlayLog, recentPlayLogUpdated, pastWeeksPlays)
test('After bucketing timestamps from the recentPlayLog map,  ', () => {
    jest.useFakeTimers('modern');

    // Set the time to be June 1st, 2024, 4:45AM
    const mockDate = new Date('2024-06-01T01:04:45.522Z');
    jest.setSystemTime(mockDate);

    const songId = "";
    const t1 = "";
    const recentPlayLog = new Map();
    recentPlayLog.set(songId, t1);
    const pastWeeksPlays = new Map();
    
    bucketTimestamps(recentPlayLog, pastWeeksPlays);
    /**
     * 1. recentPlayLog has a stream that is too old
     * 2. recentPlayLog has a stream from this week
     * 3. adding a new track to pastWeeksPlays
     * 4. adding to an existing track in pastWeeksPlays map
     * 5. 
     */

    jest.useRealTimers();
});

