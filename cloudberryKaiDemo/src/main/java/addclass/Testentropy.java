package addclass;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Testentropy {
	public static void main(String[] args){
//		Double[] topiclist=new Double[]{0.4783,0.5291,0.3212,0.1007,0.3243,0.4087,0.5876,0.4376};
//		int[] result1=FindTopics.FindTopic(topiclist);
		Double[][] words=new Double[][]{{0.4783,0.5291,0.3212,0.1007,0.3243,0.4087,0.5876,0.4376},
		{0.7783,0.2291,0.1212,0.4007,0.5243,0.2087,0.5876,0.2376}};
		List<Double[]> wordlist = new ArrayList<Double[]>();
		Collections.addAll(wordlist, words);
		double[] result1=Wordweight.Computeweight(wordlist);
		
		System.out.println("the choosen topic is"+ result1);
	}

}
