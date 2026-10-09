use chrono::{Datelike, Duration, NaiveDateTime, NaiveTime, Weekday};

/// After this long past the scheduled start, the meeting is treated as over
/// for the day, so a "meeting day only" reminder stops appearing.
const MEETING_WINDOW_AFTER_START: Duration = Duration::hours(3);

pub fn parse_weekday(name: &str) -> Option<Weekday> {
    match name.trim().to_ascii_lowercase().as_str() {
        "monday" => Some(Weekday::Mon),
        "tuesday" => Some(Weekday::Tue),
        "wednesday" => Some(Weekday::Wed),
        "thursday" => Some(Weekday::Thu),
        "friday" => Some(Weekday::Fri),
        "saturday" => Some(Weekday::Sat),
        "sunday" => Some(Weekday::Sun),
        _ => None,
    }
}

pub fn parse_time(raw: &str) -> Option<NaiveTime> {
    NaiveTime::parse_from_str(raw.trim(), "%H:%M").ok()
}

/// True on the meeting's weekday, from midnight until a few hours after the
/// start time. An unreadable time falls back to the whole day.
pub fn is_meeting_day(day: &str, time: &str, now: NaiveDateTime) -> bool {
    let Some(weekday) = parse_weekday(day) else {
        tracing::warn!("unrecognised meeting day {day:?}");
        return false;
    };
    if now.weekday() != weekday {
        return false;
    }
    let Some(start) = parse_time(time) else {
        return true;
    };
    let (end, wrapped_days) = start.overflowing_add_signed(MEETING_WINDOW_AFTER_START);
    wrapped_days > 0 || now.time() < end
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::NaiveDate;

    fn at(y: i32, m: u32, d: u32, h: u32, min: u32) -> NaiveDateTime {
        NaiveDate::from_ymd_opt(y, m, d)
            .unwrap()
            .and_hms_opt(h, min, 0)
            .unwrap()
    }

    #[test]
    fn parses_each_weekday() {
        assert_eq!(parse_weekday("Monday"), Some(Weekday::Mon));
        assert_eq!(parse_weekday("tuesday"), Some(Weekday::Tue));
        assert_eq!(parse_weekday("WEDNESDAY"), Some(Weekday::Wed));
        assert_eq!(parse_weekday("Thursday"), Some(Weekday::Thu));
        assert_eq!(parse_weekday("Friday"), Some(Weekday::Fri));
        assert_eq!(parse_weekday("Saturday"), Some(Weekday::Sat));
        assert_eq!(parse_weekday(" sunday "), Some(Weekday::Sun));
    }

    #[test]
    fn rejects_garbage() {
        assert_eq!(parse_weekday(""), None);
        assert_eq!(parse_weekday("funday"), None);
    }

    #[test]
    fn meeting_day_before_and_after_start() {
        // 2026-10-11 is a Sunday.
        assert!(is_meeting_day("sunday", "10:00", at(2026, 10, 11, 7, 0)));
        assert!(is_meeting_day("sunday", "10:00", at(2026, 10, 11, 12, 59)));
        assert!(!is_meeting_day("sunday", "10:00", at(2026, 10, 11, 13, 0)));
        assert!(!is_meeting_day("sunday", "10:00", at(2026, 10, 11, 20, 0)));
    }

    #[test]
    fn other_days_are_not_meeting_days() {
        assert!(!is_meeting_day("sunday", "10:00", at(2026, 10, 10, 9, 0)));
        assert!(!is_meeting_day("sunday", "10:00", at(2026, 10, 12, 9, 0)));
    }

    #[test]
    fn bad_time_means_whole_day() {
        assert!(is_meeting_day("sunday", "", at(2026, 10, 11, 22, 0)));
    }

    #[test]
    fn late_start_does_not_wrap() {
        assert!(is_meeting_day("sunday", "22:30", at(2026, 10, 11, 23, 0)));
    }

    #[test]
    fn bad_day_is_never_a_meeting_day() {
        assert!(!is_meeting_day("funday", "10:00", at(2026, 10, 11, 9, 0)));
    }
}
