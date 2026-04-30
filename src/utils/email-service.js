import { config } from "../config/environment.js";

export async function sendInviteEmail(email, inviteToken, userName = "Admin") {
	try {
		const inviteUrl = `${config.appUrl}/accept-invite/${inviteToken}`;

		const _emailContent = `
      <h2>You've been invited to Project Management System</h2>
      <p>Hello,</p>
      <p>${userName} has invited you to join the project management system.</p>
      <p>
        <a href="${inviteUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Accept Invitation
        </a>
      </p>
      <p>Or copy and paste this link: ${inviteUrl}</p>
      <p>This invitation expires in 7 days.</p>
    `;

		// TODO: Replace with actual email provider call
		// Example with nodemailer:
		// const transporter = nodemailer.createTransport({...});
		// await transporter.sendMail({
		//   from: config.emailFrom,
		//   to: email,
		//   subject: 'You\'re invited to Project Management',
		//   html: emailContent,
		// });

		console.log(`[EMAIL STUB] Invite sent to ${email}`);
		console.log(`[EMAIL STUB] Invite URL: ${inviteUrl}`);

		return true;
	} catch (error) {
		console.error("Error sending invite email:", error);
		throw error;
	}
}

export async function sendTaskAssignmentEmail(email, taskTitle, taskId) {
	try {
		const taskUrl = `${config.appUrl}/tasks/${taskId}`;

		const _emailContent = `
      <h2>New Task Assigned to You</h2>
      <p>A new task has been assigned to you:</p>
      <p><strong>${taskTitle}</strong></p>
      <p>
        <a href="${taskUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Task
        </a>
      </p>
    `;

		console.log(`[EMAIL STUB] Task assignment notification sent to ${email}`);
		console.log(`[EMAIL STUB] Task URL: ${taskUrl}`);

		return true;
	} catch (error) {
		console.error("Error sending task assignment email:", error);
		throw error;
	}
}

export async function sendTaskStatusChangeEmail(
	email,
	taskTitle,
	newStatus,
	taskId,
) {
	try {
		const taskUrl = `${config.appUrl}/tasks/${taskId}`;

		const _emailContent = `
      <h2>Task Status Updated</h2>
      <p>A task you're assigned to has been updated:</p>
      <p><strong>${taskTitle}</strong></p>
      <p>New Status: <strong>${newStatus}</strong></p>
      <p>
        <a href="${taskUrl}" style="background-color: #17a2b8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Task
        </a>
      </p>
    `;

		console.log(`[EMAIL STUB] Status change notification sent to ${email}`);
		console.log(`[EMAIL STUB] New status: ${newStatus}`);

		return true;
	} catch (error) {
		console.error("Error sending status change email:", error);
		throw error;
	}
}

export async function sendPasswordResetEmail(
	destinationEmail,
	firstName,
	expiryMinutes,
) {}
