import mongoose, { Schema, Document, model } from 'mongoose';

const GIftCardVisitSchema = new Schema(
    {
        gift_card_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'GiftCard',
            required: true,
        },
        date: {
            type: Date,
            required: true,
            index: true
        },
        visit_count: {
            type: Number,
            default: 0,
        }
    },
    {
        timestamps: true,
    }
);

const GiftCardVisitModel = model('Giftcardvisitcount', GIftCardVisitSchema);

export default GiftCardVisitModel;
