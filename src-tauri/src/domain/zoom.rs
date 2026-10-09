use url::Url;

const MIN_ID_DIGITS: usize = 9;
const MAX_ID_DIGITS: usize = 11;
const JOIN_PATH_PREFIXES: &[&str] = &["j", "s", "w", "wc"];

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ZoomJoin {
    pub meeting_id: String,
    pub passcode: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ParseError {
    Empty,
    NotAMeetingLink,
    WrongLength(usize),
}

impl std::fmt::Display for ParseError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ParseError::Empty => write!(f, "No meeting ID is set."),
            ParseError::NotAMeetingLink => write!(
                f,
                "That link doesn't contain a Zoom meeting ID. Paste the meeting ID or the full invite link."
            ),
            ParseError::WrongLength(n) => write!(
                f,
                "A Zoom meeting ID has {MIN_ID_DIGITS} to {MAX_ID_DIGITS} digits, but this one has {n}."
            ),
        }
    }
}

/// Accepts a bare meeting ID ("123 4567 8901") or a full invite link
/// ("https://us02web.zoom.us/j/12345678901?pwd=abc"). A passcode typed
/// separately wins over one embedded in a link.
pub fn parse(input: &str, passcode: &str) -> Result<ZoomJoin, ParseError> {
    let input = input.trim();
    if input.is_empty() {
        return Err(ParseError::Empty);
    }

    let (raw_id, link_pwd) = if looks_like_url(input) {
        parse_link(input)?
    } else {
        (input.to_string(), None)
    };

    let meeting_id: String = raw_id.chars().filter(|c| c.is_ascii_digit()).collect();
    if !(MIN_ID_DIGITS..=MAX_ID_DIGITS).contains(&meeting_id.len()) {
        return Err(ParseError::WrongLength(meeting_id.len()));
    }

    let typed = passcode.trim();
    let passcode = if typed.is_empty() {
        link_pwd
    } else {
        Some(typed.to_string())
    };

    Ok(ZoomJoin {
        meeting_id,
        passcode,
    })
}

pub fn join_url(join: &ZoomJoin) -> String {
    let mut url = format!(
        "zoommtg://zoom.us/join?action=join&confno={}",
        join.meeting_id
    );
    if let Some(pwd) = &join.passcode {
        let encoded: String = url::form_urlencoded::byte_serialize(pwd.as_bytes()).collect();
        url.push_str(&format!("&pwd={encoded}"));
    }
    url
}

fn looks_like_url(input: &str) -> bool {
    input.contains("://") || input.contains("zoom.us/") || input.contains("zoomgov.com/")
}

fn parse_link(input: &str) -> Result<(String, Option<String>), ParseError> {
    let with_scheme = if input.contains("://") {
        input.to_string()
    } else {
        format!("https://{input}")
    };
    let url = Url::parse(&with_scheme).map_err(|_| ParseError::NotAMeetingLink)?;

    let pwd = url
        .query_pairs()
        .find(|(k, _)| k == "pwd")
        .map(|(_, v)| v.into_owned())
        .filter(|v| !v.is_empty());

    if let Some((_, confno)) = url.query_pairs().find(|(k, _)| k == "confno") {
        return Ok((confno.into_owned(), pwd));
    }

    let segments: Vec<&str> = url.path_segments().map(|s| s.collect()).unwrap_or_default();
    let id = segments
        .windows(2)
        .find(|w| JOIN_PATH_PREFIXES.contains(&w[0]))
        .map(|w| w[1].to_string())
        .ok_or(ParseError::NotAMeetingLink)?;
    Ok((id, pwd))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn plain_id_with_spaces_and_dashes() {
        let j = parse("123 4567-8901", "").unwrap();
        assert_eq!(j.meeting_id, "12345678901");
        assert_eq!(j.passcode, None);
    }

    #[test]
    fn invite_link_with_pwd() {
        let j = parse("https://us02web.zoom.us/j/81234567890?pwd=ab12CD", "").unwrap();
        assert_eq!(j.meeting_id, "81234567890");
        assert_eq!(j.passcode.as_deref(), Some("ab12CD"));
    }

    #[test]
    fn link_without_scheme() {
        let j = parse("zoom.us/j/123456789", "").unwrap();
        assert_eq!(j.meeting_id, "123456789");
    }

    #[test]
    fn typed_passcode_wins_over_link() {
        let j = parse("https://zoom.us/j/123456789?pwd=fromlink", " 4321 ").unwrap();
        assert_eq!(j.passcode.as_deref(), Some("4321"));
    }

    #[test]
    fn zoommtg_link() {
        let j = parse("zoommtg://zoom.us/join?confno=123456789&pwd=x", "").unwrap();
        assert_eq!(j.meeting_id, "123456789");
        assert_eq!(j.passcode.as_deref(), Some("x"));
    }

    #[test]
    fn rejects_bad_input() {
        assert_eq!(parse("  ", ""), Err(ParseError::Empty));
        assert_eq!(parse("123 4567", ""), Err(ParseError::WrongLength(7)));
        assert_eq!(
            parse("123456789012345", ""),
            Err(ParseError::WrongLength(15))
        );
        assert_eq!(
            parse("https://zoom.us/my/kingdomhall", ""),
            Err(ParseError::NotAMeetingLink)
        );
    }

    #[test]
    fn join_url_encodes_passcode() {
        let j = ZoomJoin {
            meeting_id: "123456789".into(),
            passcode: Some("a b&c".into()),
        };
        assert_eq!(
            join_url(&j),
            "zoommtg://zoom.us/join?action=join&confno=123456789&pwd=a+b%26c"
        );
    }

    #[test]
    fn join_url_without_passcode() {
        let j = ZoomJoin {
            meeting_id: "123456789".into(),
            passcode: None,
        };
        assert_eq!(
            join_url(&j),
            "zoommtg://zoom.us/join?action=join&confno=123456789"
        );
    }
}
