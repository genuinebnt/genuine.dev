//! Mailer implementations. `LogMailer` is the dev default — it logs the email
//! instead of sending. Swap a provider (Resend/Postmark/SES) impl in production.

use crate::app::ports::Mailer;
use crate::error::AppError;

pub struct LogMailer;

impl Mailer for LogMailer {
    async fn send(&self, to: &str, subject: &str, body: &str) -> Result<(), AppError> {
        tracing::info!("[email] to={to} subject={subject:?}\n{body}");
        Ok(())
    }
}
