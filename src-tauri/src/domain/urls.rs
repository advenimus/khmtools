use url::Url;

const ALLOWED_HOSTS: &[&str] = &["github.com"];

pub fn is_allowed_external(raw: &str) -> bool {
    Url::parse(raw)
        .map(|u| u.scheme() == "https" && u.host_str().is_some_and(|h| ALLOWED_HOSTS.contains(&h)))
        .unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn allows_github_https() {
        assert!(is_allowed_external("https://github.com/advenimus/khmtools"));
    }

    #[test]
    fn rejects_other_schemes_and_hosts() {
        assert!(!is_allowed_external("http://github.com/advenimus/khmtools"));
        assert!(!is_allowed_external("file:///Applications/Calculator.app"));
        assert!(!is_allowed_external("smb://evil/share"));
        assert!(!is_allowed_external("https://github.com.evil.example/x"));
        assert!(!is_allowed_external("C:\\Windows\\System32\\calc.exe"));
        assert!(!is_allowed_external(""));
    }
}
