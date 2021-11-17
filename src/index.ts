import express, { Request, Response } from "express";
import CoinGecko from "coingecko-api";
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 60, checkperiod: 60 });
const CACHE_KEY_ALL = "all";
const client = new CoinGecko();
const app = express();

const MAX_PAGE_FETCH = 6; // per page 250 results

app.use(function (req, res, next) {
  res.header("Content-Type", "application/json");
  next();
});

app.use(express.json());

interface IAllPrice {
  symbol: string;
  price: number;
}

app.get("/all", async (req, res: Response<IAllPrice[]>) => {
  const cached = cache.get(CACHE_KEY_ALL) as IAllPrice[];
  if (cached) {
    res.json(cached);
    return;
  }
  let response: IAllPrice[] = [];
  const proms = [];
  for (let page = 1; page <= MAX_PAGE_FETCH; page++) {
    proms.push(
      client.coins.all({
        page,
        per_page: 250,
        order: "market_cap_desc",
      })
    );
  }
  const datas = await Promise.all(proms);
  for (const data of datas) {
    response = response.concat(
      data.data.map((d: any) => {
        return {
          symbol: d.symbol,
          price: d.market_data.current_price.usd,
        };
      })
    );
  }
  cache.set(CACHE_KEY_ALL, response);
  res.json(response);
});

app.listen(3000, () => {
  console.log("The application is listening on port 3000!");
});
