/// Calculates total in-person + remote attendance from Zoom poll responses.
///
/// `counts[0..10]` are the response counts for poll options labelled "1 person",
/// "2 people", ..., "10 people". Each is multiplied by its option value
/// (number of people watching together).
///
/// `counts[10]` is phone-call connections; each phone counts as one person.
pub const OPTION_COUNT: usize = 11;
pub const MAX_RESPONSES_PER_OPTION: u32 = 10_000;

pub fn validate(counts: &[u32]) -> Result<(), String> {
    if counts.len() != OPTION_COUNT {
        return Err(format!(
            "Expected {OPTION_COUNT} poll values but got {}.",
            counts.len()
        ));
    }
    if counts.iter().any(|&c| c > MAX_RESPONSES_PER_OPTION) {
        return Err(format!(
            "Each poll option can be at most {MAX_RESPONSES_PER_OPTION}. Check for a typo."
        ));
    }
    Ok(())
}

pub fn calculate(counts: &[u32]) -> u32 {
    let mut total = 0u32;
    for (i, &c) in counts.iter().enumerate().take(10) {
        total = total.saturating_add(c.saturating_mul((i + 1) as u32));
    }
    if let Some(&phone) = counts.get(10) {
        total = total.saturating_add(phone);
    }
    total
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn empty_poll_is_zero() {
        assert_eq!(calculate(&[0; 11]), 0);
    }

    #[test]
    fn single_one_person() {
        let mut c = [0u32; 11];
        c[0] = 1;
        assert_eq!(calculate(&c), 1);
    }

    #[test]
    fn ten_tens() {
        let mut c = [0u32; 11];
        c[9] = 10;
        assert_eq!(calculate(&c), 100);
    }

    #[test]
    fn phone_counts_as_one() {
        let mut c = [0u32; 11];
        c[10] = 7;
        assert_eq!(calculate(&c), 7);
    }

    #[test]
    fn mixed_realistic() {
        // 3 households of 1, 2 of 2, 1 of 5, 1 phone = 3 + 4 + 5 + 1 = 13
        let mut c = [0u32; 11];
        c[0] = 3;
        c[1] = 2;
        c[4] = 1;
        c[10] = 1;
        assert_eq!(calculate(&c), 13);
    }

    #[test]
    fn ignores_extra_indices() {
        let v: Vec<u32> = vec![1; 50];
        // first 10 → 1+2+...+10 = 55, plus phone (idx 10) = 1, total 56
        assert_eq!(calculate(&v), 56);
    }

    #[test]
    fn handles_empty_slice() {
        assert_eq!(calculate(&[]), 0);
    }

    #[test]
    fn each_option_has_its_own_weight() {
        for i in 0..10 {
            let mut c = [0u32; 11];
            c[i] = 1;
            assert_eq!(calculate(&c), (i + 1) as u32, "option index {i}");
        }
    }

    #[test]
    fn saturates_instead_of_wrapping() {
        let c = [u32::MAX; 11];
        assert_eq!(calculate(&c), u32::MAX);
    }

    #[test]
    fn validate_accepts_normal_poll() {
        assert!(validate(&[3, 2, 0, 0, 1, 0, 0, 0, 0, 0, 1]).is_ok());
    }

    #[test]
    fn validate_rejects_wrong_length_and_typos() {
        assert!(validate(&[0; 10]).is_err());
        assert!(validate(&[0; 12]).is_err());
        let mut c = [0u32; 11];
        c[3] = MAX_RESPONSES_PER_OPTION + 1;
        assert!(validate(&c).is_err());
    }
}
