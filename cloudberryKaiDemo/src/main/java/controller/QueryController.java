package controller;

import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import AsterixDbConnection.QueryFactory;
import AsterixDbConnection.QueryFactoryTS;
import entity.IndustryNew;

@RestController
@RequestMapping("/keywordQuery")
public class QueryController {
	
	/**
	 * Rest API请求
	 * @param keyword
	 * @return
	 */
	private String[] data;
	private String bql ="http://139.224.228.48:8065/similar_words/";
	private int num=10;
	
	@RequestMapping(value = "/{keyword}", method = RequestMethod.GET)
	public List<IndustryNew> cloudberryQuery(
			@PathVariable("keyword") String keyword) {
		this.data=null;
		Findsynonyms(keyword,num);
		List<IndustryNew> ret ;
		try {
			ret = QueryFactory.keywordQuery(data, 100);
			return ret;
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return null;
	}

	private void Findsynonyms(String keyword,int num) {
		String aql=bql+keyword+"/"+num;
		 String ss = HttpRequest.sendGet(aql);
		    String[] re = ss.split("/n");
	        String[] tmp = re[0].split(":"); //
		    data = new String[tmp.length-1];
		    String[] tmp0 = tmp[0].split("\\(");
		    data[0]=tmp0[0];
		    System.out.println("------Synonyms---------" + 0+"----------" +data[0]);
		    for (int ir = 1; ir < tmp.length-1; ir++) {
		    	String[] tmpir = tmp[ir].split("\\(");
		        data[ir]=tmpir[0].substring(14);
		       
		        System.out.println("------Synonyms---------" + ir+"---------" +data[ir]);
		        }
		  
		}
	}
	
	

