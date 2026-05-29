const { sql } = require('../db');
const crypto = require('crypto');
const transporter = require('./transporter');

async function createSubscriber( email, service_id) {

    // fetch the subscriber by email to check if they already exist
    // then check if the subscriber is confirmed or not if not return an error stating email not verified 
    // if the subscriber is confirmed then check if they are already subscribed to the service if yes return an error else create a new subscription
    try {
        const existingSubscriber = await sql`SELECT * FROM subscribers WHERE email = ${email}`;
        if (existingSubscriber.length > 0) {
            const subscriber = existingSubscriber[0];
            if (!subscriber.confirmed) {
                throw new Error("Email not verified. Please confirm your email before subscribing.");
            }
            const existingSubscription = await sql`
                SELECT * FROM subscriptions
                WHERE subscriber_id = ${subscriber.id} AND service_id = ${service_id}
            `;
            if (existingSubscription.length > 0) {
                throw new Error("Already subscribed to this service.");
            }
            await sql`
                INSERT INTO subscriptions (subscriber_id, service_id)
                VALUES (${subscriber.id}, ${service_id})
            `;
            return { message: "Subscription created successfully." };
        } else {
            const token = crypto.randomBytes(32).toString('hex');
            const newSubscriber = await sql`

                INSERT INTO subscribers (email, token)
                VALUES (${email}, ${token})
                RETURNING *
            `;
            // Send confirmation email with the token
            await transporter.sendMail({
                from: process.env.SMTP_FROM || '"Status Page" <noreply@example.com>',
                to: email,
                subject: 'Confirm your subscription',
                text: `Please confirm your subscription by visiting: ${process.env.BASE_URL || 'http://localhost:3000'}/api/subscriber/confirm?token=${token}`,
                html: `<p>Please confirm your subscription by clicking <a href="${process.env.BASE_URL || 'http://localhost:3000'}/api/subscriber/confirm?token=${token}">here</a>.</p>`,
            });
            return { message: "Subscriber created. Please confirm your email.", subscriber: newSubscriber[0] };
        }
}
    catch (err) {
        console.error("Error creating subscriber:", err);
        throw err;
    }   
}

async function deleteSubscriber(email, service_id) {
    try {
        const existingSubscriber = await sql`SELECT * FROM subscribers WHERE email = ${email}`;
        if (existingSubscriber.length === 0) {
            throw new Error("Subscriber not found.");
        }
        const subscriber = existingSubscriber[0];
        const existingSubscription = await sql`
            SELECT * FROM subscriptions
            WHERE subscriber_id = ${subscriber.id} AND service_id = ${service_id}
        `;
        if (existingSubscription.length === 0) {
            throw new Error("Subscription not found for this service.");
        }
        await sql`
            DELETE FROM subscriptions
            WHERE subscriber_id = ${subscriber.id} AND service_id = ${service_id}
        `;
        return { message: "Unsubscribed successfully." };
    } catch (err) {
        console.error("Error deleting subscriber:", err);
        throw err;
    }
}

async function confirmSubscriber(token) {
    try {
        const result = await sql`
            UPDATE subscribers
            SET confirmed = true, token = null
            WHERE token = ${token} AND confirmed = false
            RETURNING *
        `;
        if (result.length === 0) {
            throw new Error("Invalid or already used confirmation token.");
        }
        return { message: "Email confirmed successfully.", subscriber: result[0] };
    } catch (err) {
        console.error("Error confirming subscriber:", err);
        throw err;
    }
}

module.exports = {
    createSubscriber,
    confirmSubscriber,
    deleteSubscriber
}