import List = require('../util/List');
import MimeEncodedText = require('../value/MimeEncodedText');
import Status = require('../system/Status');
import File = require('../io/File');

/**
 * This class is used to send an email with either plain text or MimeEncodedText content.
 * Recipient data (from, to, cc, bcc) and subject are specified
 * using setter methods. When the dw.net.Mail.send method is invoked,
 * the email is put into an internal queue and sent asynchronously.
 * 
 * Note: when this class is used with sensitive data, be careful in persisting sensitive information to disk.
 * 
 * The following example script sends an email with MimeEncodedText content:
 * 
 * ```
 * `
 * function sendMail() {
 * var template: Template = new dw.util.Template("myTemplate.isml");
 * 
 * var o: Map = new dw.util.HashMap();
 * o.put("customer","customer");
 * o.put("product","product");
 * 
 * var content: MimeEncodedText = template.render(o);
 * var mail: Mail = new dw.net.Mail();
 * mail.addTo("to@example.org");
 * mail.setFrom("from@example.org");
 * mail.setSubject("Example Email");
 * mail.setContent(content);
 * 
 * mail.send();//returns either Status.ERROR or Status.OK, mail might not be sent yet, when this method returns
 * }
 * `
 * ```
 * 
 * See Sending email via scripts or hooks in the documentation for additional examples.
 */
declare class Mail {
    /**
     * Gets the `bcc` address List.
     */
    bcc: List<string>;
    /**
     * Gets the `cc` address List.
     */
    cc: List<string>;
    /**
     * Gets the email address to use as the `from` address for the
     * email.
     */
    from: string | null;
    /**
     * Gets the `replyTo` address List.
     */
    readonly replyTo: List<string>;
    /**
     * Gets the `subject` of the email.
     */
    subject: string | null;
    /**
     * Gets the `to` address List where the email is sent.
     */
    to: List<string>;
    private constructor();
    /**
     * Validates the address that is sent as parameter.
     * This validation includes:
     * 
     * - The format must match RFC822
     * - The address must be 7-bit ASCII
     * - The top-level domain must be IANA-registered
     * - Sample domains such as example.com are not allowed
     */
    static validateAddress(address: string): boolean;
    /**
     * Adds a file attachment to the email. This method is restricted to Job context only.
     * @throws IllegalArgumentException if the file is null, doesn't exist, or is not a file
     */
    addAttachment(file: File): Mail;
    /**
     * Adds an address to the `bcc` List. Address must conform to the RFC822 standard.
     */
    addBcc(bcc: string): Mail;
    /**
     * Adds an address to the `cc` List. The address must conform to RFC822 standard.
     */
    addCc(cc: string): Mail;
    /**
     * Adds an address to the `replyTo` List. Address must conform to the RFC822 standard.
     * @throws IllegalArgumentException if the email address is invalid
     */
    addReplyTo(replyTo: string): Mail;
    /**
     * Adds an address to the `to` address List. The address must conform to the RFC822 standard.
     */
    addTo(to: string): Mail;
    /**
     * Gets the `bcc` address List.
     */
    getBcc(): List<string>;
    /**
     * Gets the `cc` address List.
     */
    getCc(): List<string>;
    /**
     * Gets the email address to use as the `from` address for the
     * email.
     */
    getFrom(): string | null;
    /**
     * Gets the `replyTo` address List.
     */
    getReplyTo(): List<string>;
    /**
     * Gets the `subject` of the email.
     */
    getSubject(): string | null;
    /**
     * Gets the `to` address List where the email is sent.
     */
    getTo(): List<string>;
    /**
     * prepares an email that is queued to the internal mail system for
     * delivery.
     */
    send(): Status;
    /**
     * Sets the `bcc` address List. If there
     * are already `bcc` addresses they are overwritten.
     */
    setBcc(bcc: List<any>): Mail;
    /**
     * Sets the `cc` address List where the email is sent. If there are
     * already `cc` addresses set, they are overwritten. The address(es) must
     * conform to the RFC822 standard.
     */
    setCc(cc: List<any>): Mail;
    /**
     * Mandatory Sets the email content. The MIME type is set to
     * "text/plain;charset=UTF-8" and encoding set to "UTF-8".
     */
    setContent(content: string): Mail;
    /**
     * Mandatory Sets the email content, MIME type, and encoding. No
     * validation of MIME type and encoding is done. It is the responsibility of
     * the caller to specify a valid MIME type and encoding.
     */
    setContent(content: string, mimeType: string, encoding: string): Mail;
    /**
     * Mandatory Uses dw.value.MimeEncodedText to set the
     * content, MIME type and encoding.
     */
    setContent(mimeEncodedText: MimeEncodedText): Mail;
    /**
     * Mandatory Sets the sender address for this email. The address must
     * conform to the RFC822 standard.
     */
    setFrom(from: string): Mail;
    /**
     * Sets the List-Unsubscribe header value to work with List-Unsubscribe-Post to allow integration with an
     * externally-managed mailing list.
     */
    setListUnsubscribe(listUnsubscribe: string): Mail;
    /**
     * Sets the List-Unsubscribe-Post header value. This header supports one-click unsubscribe functionality.
     */
    setListUnsubscribePost(listUnsubscribePost: string): Mail;
    /**
     * Mandatory sets the `subject` for the email. If the `subject` is not set
     * or set to null at the time dw.net.Mail.send is invoked and
     * IllegalArgumentException is thrown.
     */
    setSubject(subject: string): Mail;
    /**
     * Sets the `to` address List where the email is sent. If there are
     * already `to` addresses, they are overwritten.
     */
    setTo(to: List<any>): Mail;
}

export = Mail;
