export const convertStringToBigInt =  (obj: any): any =>  {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
  
        // 如果值是字符串，且能被解析为大数字，则转换为 BigInt
        if (typeof value === "string" && /^\d+$/.test(value)) {
          obj[key] = BigInt(value);
        }
  
        // 如果值是对象或数组，则递归处理
        else if (typeof value === "object" && value !== null) {
          obj[key] = convertStringToBigInt(value);
        }
      }
    }
    return obj;
  }