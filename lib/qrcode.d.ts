declare module 'qrcode' {
 const QRCode:{toCanvas(canvas:HTMLCanvasElement,text:string,options?:{width?:number;margin?:number;errorCorrectionLevel?:string;color?:{dark:string;light:string}}):Promise<void>};
 export default QRCode;
}
