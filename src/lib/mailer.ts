import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
    },
})

export const sendVerificationEmail = async (
    to: string,
    code: string
) => {
    await transporter.sendMail({
        from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
        to,
        subject: 'Código de verificación',
        html: `<p>Tu código de verificación es: <strong>${code}</strong></p>`,
    })
}
