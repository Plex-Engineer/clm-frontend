import { BalanceSheetPriceObject, LPPriceObject } from "hooks/useBalanceSheet";

export function getPriceFromTokenAddress(
  address: string,
  priceObject: BalanceSheetPriceObject[] | undefined
): number {
  if (!priceObject) {
    return 0;
  }
  return (
    priceObject.find((token) => token.tokenAddress == address)?.priceInNote ?? 0
  );
}

interface TokensPerLP {
  token1: number;
  token2: number;
}
export function getTokensPerLP(
  LPAddress: string,
  LPPriceObject: LPPriceObject[] | undefined
): TokensPerLP {
  if (!LPPriceObject) {
    return { token1: 0, token2: 0 };
  }
  const LPObject = LPPriceObject.find((token) => token.LPAddress == LPAddress);
  if (LPObject) {
    return {
      token1: LPObject.token1.tokensPerLP,
      token2: LPObject.token2.tokensPerLP,
    };
  }
  return { token1: 0, token2: 0 };
}

export function truncateNumber(value: string, decimals?: number) {
  let decimalLocation = value.indexOf(".");
  const scientificEIndex = value.indexOf("e");
  if (scientificEIndex != -1) {
    const scientificNotationValue = value.slice(
      scientificEIndex + 1,
      value.length
    );
    if (scientificNotationValue[0] == "-") {
      value =
        "0." +
        "0".repeat(
          Number(scientificNotationValue.slice(1, value.length)) -
            decimalLocation
        ) +
        value.slice(0, decimalLocation) +
        value.slice(decimalLocation + 1, scientificEIndex);
    }
    //TODO for scientific notation positive
  }
  console.log(value);
  decimalLocation = value.indexOf(".");
  if (Number(value) == 0) {
    return "0";
  }
  if (decimalLocation == -1) {
    return value;
  }
  if (!decimals) {
    if (Number(value) > 1) {
      return value.slice(0, decimalLocation + 3);
    }
    return value.slice(0, findFirstNonZeroAfter(value, decimalLocation) + 3);
  }
  return value.slice(0, decimalLocation + decimals);
}
function findFirstNonZeroAfter(value: string, after: number) {
  for (let i = after + 1; i < value.length; i++) {
    if (value[i] != "0") {
      return i - 1;
    }
  }
  return value.length - 1;
}

export function _get_y(x0: number, xy: number, y: number) {
  for (let i = 0; i < 255; i++) {
    const y_prev = y;
    const k = _f(x0, y);
    if (k < xy) {
      const dy = ((xy - k) * 1e18) / _d(x0, y);
      y = y + dy;
    } else {
      const dy = ((k - xy) * 1e18) / _d(x0, y);
      y = y - dy;
    }
    if (y > y_prev) {
      if (y - y_prev <= 1) {
        return y;
      }
    } else {
      if (y_prev - y <= 1) {
        return y;
      }
    }
  }
  return y;
}
function _f(x0: number, y: number) {
  return (
    (x0 * ((((y * y) / 1e18) * y) / 1e18)) / 1e18 +
    (((((x0 * x0) / 1e18) * x0) / 1e18) * y) / 1e18
  );
}
function _d(x0: number, y: number) {
  return (3 * x0 * ((y * y) / 1e18)) / 1e18 + (((x0 * x0) / 1e18) * x0) / 1e18;
}
function _k(x: number, y: number) {
  const _x = (x * 1e18) / 1e18;
  const _y = (y * 1e18) / 1e6;
  const _a = (_x * _y) / 1e18;
  const _b = (_x * _x) / 1e18 + (_y * _y) / 1e18;
  return (_a * _b) / 1e18; // x3y+y3x >= k
}

export function _getAmountOut(
  amountIn: number,
  _reserve0: number,
  _reserve1: number
) {
  const xy = _k(_reserve0, _reserve1);
  _reserve0 = (_reserve0 * 1e18) / 1e18;
  _reserve1 = (_reserve1 * 1e18) / 1e6;
  const reserveA = _reserve1;
  const reserveB = _reserve0;
  amountIn = (amountIn * 1e18) / 1e6;
  const y = reserveB - _get_y(amountIn + reserveA, xy, reserveB);
  return (y * 1e6) / 1e18;
}