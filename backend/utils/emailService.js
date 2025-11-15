const nodemailer = require('nodemailer');

const createTransporter = async () => {
  if (process.env.NODE_ENV === 'production') {
    if (process.env.EMAIL_HOST) {
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT || 587),
        secure: false,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });
    }
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  }
};

// Função para enviar e-mail de verificação
const sendVerificationEmail = async (email, name, verificationToken) => {
  try {
    const transporter = await createTransporter();
    
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@sistemainfo.com',
      to: email,
      subject: 'Confirme seu e-mail - Sistema de Informática',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1976d2; color: white; padding: 20px; text-align: center;">
            <h1>Sistema de Informática</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f5f5f5;">
            <h2>Olá, ${name}!</h2>
            
            <p>Obrigado por se cadastrar em nosso sistema. Para completar seu registro, precisamos verificar seu endereço de e-mail.</p>
            
            <p>Clique no botão abaixo para confirmar seu e-mail:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Confirmar E-mail
              </a>
            </div>
            
            <p>Ou copie e cole o link abaixo em seu navegador:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            
            <p><strong>Este link expira em 24 horas.</strong></p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            
            <p style="color: #666; font-size: 12px;">
              Se você não se cadastrou em nosso sistema, pode ignorar este e-mail com segurança.
            </p>
          </div>
          
          <div style="background-color: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p>&copy; 2024 Sistema de Informática. Todos os direitos reservados.</p>
          </div>
        </div>
      `,
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('E-mail de verificação enviado:', info.messageId);
    
    // Em desenvolvimento, mostrar o link de preview do Ethereal
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Erro ao enviar e-mail de verificação:', error);
    return { success: false, error: error.message };
  }
};

// Função para reenviar e-mail de verificação
const resendVerificationEmail = async (email, name, verificationToken) => {
  return await sendVerificationEmail(email, name, verificationToken);
};

module.exports = {
  sendVerificationEmail,
  resendVerificationEmail,
};