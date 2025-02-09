import { stripe } from "../lib/stripe.js";
import Order from "../models/order.model.js";

async function creatStripeCoupon(discountPercentage) {
    const coupon = await stripe.coupons.create({
        percent_off: discountPercentage,
        duration: "once"
    });

    return coupon.id;
}

async function createNewCoupon(userId) {
    const newCoupon = new Coupon({
        code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
        discountPercentage: 10,
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        userId: userId
    });

    await newCoupon.save();

    return newCoupon;
}

export const createCheckoutSession = async (req, res) => {
    try {
        const { products, couponCode } = req.body;

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: "No products provided" });
        }

        let totalAmount = 0;

        const linItems = products.map(product => {
            const amount = Math.round(product.price * 100) // cents => 10$ * 100 = 1000 cents
            totalAmount += amount * product.quantity;

            return {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: product.name,
                        image: [product.image],
                    },
                    unit_amount: amount,
                }
            }
        });

        let coupon = null;
        if (couponCode) {
            coupon = await Coupon.findOne({
                code: couponCode,
                userId: req.user._id,
                isActive: true
            });

            if (coupon) {
                totalAmount -= Math.round(totalAmount * (coupon.discountPercentage / 100));
            }
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card", "paypal"],
            line_items: linItems,
            mode: "payment",
            success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
            discounts: 
                coupon ? [
                    {
                        coupon: await creatStripeCoupon(coupon.discountPercentage),
                    },
                ]
                : [],
            metadata: {
                userId: req.user._id.toString(),
                couponCode: couponCode || "",
                products: JSON.stringify(
                    products.map((p) => ({
                        id: p._id,
                        quantity: p.quantity,
                        price: p.price,
                    }))
                )
            }
        });

        let newCoupon = null;
        if (totalAmount >= 20000) {
            newCoupon = await createNewCoupon(req.user._id);
        }

        res.status(200).json({ sessionId: session.id, totalAmount: totalAmount / 100, newCoupon });

    } catch (error) {
        console.log("Error creating checkout session", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

export const checkoutSuccess = async (req, res) => {
    try {
        const { sessionId } = req.body;

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === "paid") {
            if (session.metadata.couponCode) {
                await coupon.findOneAndUpdate({
                    code: session.metadata.couponCode,
                    userId: session.metadata.userId,
                }, {
                    isActive: false
                })
            }

            //create a new order
            const products = JSON.parse(session.metadata.products);
            const newOrder = new Order({
                user: session.metadata.userId,
                products: products.map(product => ({
                    product: product.id,
                    quantity: product.quantity,
                    price: product.price
                })),
                totalAmount: session.amount_total /100, //convert from cents to $
                stripeSessionId: sessionId
            });

            await newOrder.save();

            res.status(200).json({
                success: true,
                message: "Payment successful, order created and coupon is deactivated if used.",
                orderId: newOrder._id
            });
        }
    } catch (error) {
        console.log("Error checking out", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}