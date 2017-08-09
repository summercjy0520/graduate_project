package AsterixDbConnection;

import java.util.ArrayList;
import java.util.List;

import org.json.JSONArray;

import entity.IndustryNew;

public class QueryFactory {
	private static String asterixdbUrl = "http://172.16.132.48:19002";

	/**
	 * 根据关键词查询行业新闻
	 * @param keyword
	 * @param limit
	 * @return
	 * @throws Exception
	 */
	public static List<IndustryNew> keywordQuery(String[] keyword, int limit)
			throws Exception {
		List<IndustryNew> retList = new ArrayList<IndustryNew>();
		for(int index=0;index<keyword.length;index++){
			AsterixConf aconf = new AsterixConf(asterixdbUrl).setDataverse("test");
			aconf.setBody(new StringBuilder()
				.append(" for $a in dataset news where contains($a.sectionIndex,\"")	
				.append(keyword[index]).append("\")")
//				.append(" and not(is-null($a.dateline))  let $dateStr :=print_datetime($a.dateline, ")
//				.append("\"Y-M-D\")")    //2016-01-26T05:47:00.000Z
//				.append(" group by $dateStr with $a")
				.append(" limit ").append(limit)
				.append(" return $a").toString());
			String ret = new AsterixConn().handleRequest(aconf,
				AsterixConf.OpType.QUERY);
			JSONArray ja = new JSONArray(ret);
			for (int i = 0; i < ja.length(); i++) {
				IndustryNew news = new IndustryNew(ja.getJSONObject(i));
				retList.add(news);
				}
		}
		return retList;
	}
	
	
}