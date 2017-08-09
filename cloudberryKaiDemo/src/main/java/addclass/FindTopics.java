package addclass;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;

public class FindTopics {
	
	@SuppressWarnings({ "unchecked", "rawtypes" })
	public static int[] FindTopic(Double[] list){
		List<Double> topiclist = new ArrayList<Double>();
		Collections.addAll(topiclist, list);
		selectsort(topiclist);
		int index=0;
		double maxgain=0.00;
		double entropy = 0.00;
		for (int i = 1 ; i < topiclist.size(); i++){
			double p =(topiclist.get(i)-topiclist.get(i-1))/topiclist.get(i);
			entropy+=-p*Math.log(p);
		}
		for (int j=0; j<topiclist.size() ; j++){
			double gain=entropy-ConditionalEntropy(topiclist,j);
			if (gain >maxgain)
				index = j;
			else
				break;
		}
		HashMap map=new HashMap();
		for(int i=0;i<list.length;i++)	{
			map.put(list[i],i); //将值和下标存入Map
			}
		int[] indextopics=new int[topiclist.size()-index-1];
		for ( int i=index+1; i<topiclist.size();i++){
			indextopics[i-index-1]=(Integer)(map.get(topiclist.get(i)));
		}
		return (indextopics);
		
	}

	private static List<Double> selectsort(List<Double> topiclist) {
		for (int i=0; i<topiclist.size(); i++){
			double min=topiclist.get(i);
			int n=i;
			for (int j=i+1; j<topiclist.size(); j++){
				if (topiclist.get(j)<min){
					min=topiclist.get(j);
					n=j;
				}
			}
			topiclist.set(n, topiclist.get(i));
			topiclist.set(i, min);
		}
		return topiclist;
	}

	private static double ConditionalEntropy(List<Double> topiclist, int j) {
		List<Double> list1 =topiclist.subList(0, j);
		List<Double> list2 =topiclist.subList(j, topiclist.size()-1);
		
		double entropy1 = 0.00;
		for (int i = 1 ; i < list1.size(); i++){
			double p =(list1.get(i)-list1.get(i-1))/list1.get(i);
			entropy1+=-p*Math.log(p);
		}
		double entropy2 = 0.00;
		for (int i = 1 ; i < list2.size(); i++){
			double p =(list2.get(i)-list2.get(i-1))/list2.get(i);
			entropy2+=-p*Math.log(p);
		}
		
		double conditionalentropy = (j+1/topiclist.size())*entropy1+(topiclist.size()-j)*entropy2/topiclist.size();
		return conditionalentropy;
	}

}
