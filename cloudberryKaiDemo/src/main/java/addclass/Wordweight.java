package addclass;

import java.util.Collections;
import java.util.List;
import java.util.Vector;

public class Wordweight {
	@SuppressWarnings("unchecked")
	public static double[] Computeweight(List<Double[]> wordlist){
		int a=wordlist.size();
		@SuppressWarnings("rawtypes")
		Vector  wordweight = new Vector(); 
		for(int i =0 ; i < a ; i++){
			Double[] temp=wordlist.get(i);
			double re=0.00;
			for (int j = 0 ; j < temp.length; j++){
				re+=-temp[j]*Math.log(temp[j]);
			}
			wordweight.add(re);
		}
//		double weightmin=new Double(Collections.min(wordweight).toString());
//		double weightmax=new Double(Collections.max(wordweight).toString());
//		double[] outputweight= new double[a];
//		for(int h=0; h<wordweight.size(); h++){
//			double weightnow=new Double(wordweight.get(h).toString());
//			outputweight[h]=(weightnow-weightmin)/(weightmax-weightmin);
//		}
		double[] outputweight= new double[wordweight.size()];
		for (int i=0;i<wordweight.size(); i++){
			outputweight[i]=(double)wordweight.get(i);
		}
		return outputweight;
		
	}

}
