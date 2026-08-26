use chrono::{DateTime, Local, NaiveDate, NaiveTime};

/// Calculates the logical date based on the local date-time and the configured day start time (in minutes since midnight).
pub fn logical_date(
    now: DateTime<Local>,
    day_start_minutes: u64,
) -> NaiveDate {
    let hour = (day_start_minutes / 60) as u32;
    let minute = (day_start_minutes % 60) as u32;
    let day_start_time = NaiveTime::from_hms_opt(hour, minute, 0)
        .unwrap_or_else(|| NaiveTime::from_hms_opt(4, 0, 0).unwrap());
    
    if now.time() < day_start_time {
        now.date_naive()
            .pred_opt()
            .expect("previous date should exist")
    } else {
        now.date_naive()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::TimeZone;

    #[test]
    fn test_logical_date_boundaries() {
        // Default 4:00 AM (240 minutes)
        let day_start_mins = 240;

        // 2026-08-19 03:59:59 - should be previous day (2026-08-18)
        let now_before = Local.with_ymd_and_hms(2026, 8, 19, 3, 59, 59).unwrap();
        assert_eq!(
            logical_date(now_before, day_start_mins),
            NaiveDate::from_ymd_opt(2026, 8, 18).unwrap()
        );

        // 2026-08-19 04:00:00 - should be current day (2026-08-19)
        let now_exact = Local.with_ymd_and_hms(2026, 8, 19, 4, 0, 0).unwrap();
        assert_eq!(
            logical_date(now_exact, day_start_mins),
            NaiveDate::from_ymd_opt(2026, 8, 19).unwrap()
        );

        // 2026-08-19 04:00:01 - should be current day (2026-08-19)
        let now_after = Local.with_ymd_and_hms(2026, 8, 19, 4, 0, 1).unwrap();
        assert_eq!(
            logical_date(now_after, day_start_mins),
            NaiveDate::from_ymd_opt(2026, 8, 19).unwrap()
        );

        // Custom 00:00 AM (0 minutes)
        let day_start_mins_midnight = 0;
        let now_midnight = Local.with_ymd_and_hms(2026, 8, 19, 0, 0, 0).unwrap();
        assert_eq!(
            logical_date(now_midnight, day_start_mins_midnight),
            NaiveDate::from_ymd_opt(2026, 8, 19).unwrap()
        );

        // Month boundary: 2026-08-01 02:00:00 with 4 AM start - should be 2026-07-31
        let month_boundary = Local.with_ymd_and_hms(2026, 8, 1, 2, 0, 0).unwrap();
        assert_eq!(
            logical_date(month_boundary, day_start_mins),
            NaiveDate::from_ymd_opt(2026, 7, 31).unwrap()
        );

        // Year boundary: 2026-01-01 03:00:00 with 4 AM start - should be 2025-12-31
        let year_boundary = Local.with_ymd_and_hms(2026, 1, 1, 3, 0, 0).unwrap();
        assert_eq!(
            logical_date(year_boundary, day_start_mins),
            NaiveDate::from_ymd_opt(2025, 12, 31).unwrap()
        );

        // Leap year boundary: 2024-03-01 02:00:00 with 4 AM start - should be 2024-02-29
        let leap_year_boundary = Local.with_ymd_and_hms(2024, 3, 1, 2, 0, 0).unwrap();
        assert_eq!(
            logical_date(leap_year_boundary, day_start_mins),
            NaiveDate::from_ymd_opt(2024, 2, 29).unwrap()
        );

        // Invalid day_start_minutes (>= 1440) - should fallback to 4:00 AM
        let invalid_day_start_mins = 1500; // 25 hours

        // 2026-08-19 03:00:00 - should be previous day (2026-08-18) because fallback is 4:00 AM
        let before_fallback = Local.with_ymd_and_hms(2026, 8, 19, 3, 0, 0).unwrap();
        assert_eq!(
            logical_date(before_fallback, invalid_day_start_mins),
            NaiveDate::from_ymd_opt(2026, 8, 18).unwrap()
        );

        // 2026-08-19 05:00:00 - should be current day (2026-08-19) because fallback is 4:00 AM
        let after_fallback = Local.with_ymd_and_hms(2026, 8, 19, 5, 0, 0).unwrap();
        assert_eq!(
            logical_date(after_fallback, invalid_day_start_mins),
            NaiveDate::from_ymd_opt(2026, 8, 19).unwrap()
        );

        // Late start boundary: 23:59 (1439 minutes)
        let late_start_mins = 1439;

        // 2026-08-19 23:58:00 - should be previous day (2026-08-18)
        let before_late = Local.with_ymd_and_hms(2026, 8, 19, 23, 58, 0).unwrap();
        assert_eq!(
            logical_date(before_late, late_start_mins),
            NaiveDate::from_ymd_opt(2026, 8, 18).unwrap()
        );

        // 2026-08-19 23:59:00 - should be current day (2026-08-19)
        let after_late = Local.with_ymd_and_hms(2026, 8, 19, 23, 59, 0).unwrap();
        assert_eq!(
            logical_date(after_late, late_start_mins),
            NaiveDate::from_ymd_opt(2026, 8, 19).unwrap()
        );
    }
}
