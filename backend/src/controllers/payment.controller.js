import Payment from "../models/Payment.js";
import Service from "../models/Service.js";
import { sendPaymentSuccessEmail } from "../config/mail.js";

// CREATE ORDER
export const createPayment = async (req, res) => {
    try {
        const { serviceId } = req.body;

        const service = await Service.findById(serviceId);
        if (!service) return res.status(404).json({ error: "Service not found" });

        const payment = await Payment.create({
            user: req.user._id,
            service: serviceId,
            amount: service.price
        });

        res.json({
            paymentId: payment._id,
            amount: service.price,
            message: "Payment initiated"
        });

    } catch (err) {
        res.status(500).json({ error: "Payment initiation failed" });
    }
};

// VERIFY PAYMENT (SIMULATION)
export const verifyPayment = async (req, res) => {
    try {
        const { paymentId, success } = req.body;

        const payment = await Payment.findById(paymentId);
        if (!payment) return res.status(404).json({ error: "Payment not found" });

        payment.status = success ? "SUCCESS" : "FAILED";
        await payment.save();

        if (success) {
            await sendPaymentSuccessEmail(req.user.email, req.user.fullName);
        }

        res.json({ message: "Payment updated", status: payment.status });

    } catch (err) {
        res.status(500).json({ error: "Verification failed" });
    }
};
