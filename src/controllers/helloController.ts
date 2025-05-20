import { NextFunction, Request, Response } from "express";

const getHelloMessage = () => {
    return 'Hola mundo desde el controlador';
};

const getHello = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const message = getHelloMessage();
        res.status(200).send(message);
        next && next(); // por si usás middlewares en cadena
    } catch (e) {
        console.error(e);
        res.status(500).send('Error interno del servidor');
        next && next(e);
    }
};

export default {
  getHello,
}