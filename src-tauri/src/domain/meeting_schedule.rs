use chrono::{Datelike, Local, Weekday};

pub fn parse_weekday(name: &str) -> Option<Weekday> {
    match name.to_ascii_lowercase().as_str() {
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

pub fn is_today(name: &str) -> bool {
    parse_weekday(name)
        .map(|wd| wd == Local::now().weekday())
        .unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_each_weekday() {
        assert_eq!(parse_weekday("Monday"), Some(Weekday::Mon));
        assert_eq!(parse_weekday("tuesday"), Some(Weekday::Tue));
        assert_eq!(parse_weekday("WEDNESDAY"), Some(Weekday::Wed));
        assert_eq!(parse_weekday("Thursday"), Some(Weekday::Thu));
        assert_eq!(parse_weekday("Friday"), Some(Weekday::Fri));
        assert_eq!(parse_weekday("Saturday"), Some(Weekday::Sat));
        assert_eq!(parse_weekday("Sunday"), Some(Weekday::Sun));
    }

    #[test]
    fn rejects_garbage() {
        assert_eq!(parse_weekday(""), None);
        assert_eq!(parse_weekday("funday"), None);
    }
}
