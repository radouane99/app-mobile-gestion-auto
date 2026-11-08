package ma.autocarnet;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
final class ReminderRules {
 static String stage(LocalDate today,LocalDate due,boolean kmDue){
   if(kmDue)return "km";
   long days=ChronoUnit.DAYS.between(today,due);
   if(days<=0)return "due";
   if(days<=7)return "week";
   if(!today.isBefore(due.minusMonths(1)))return "month";
   return null;
 }
 static String oilStage(LocalDate today,LocalDate due,int current,int target,int warn){if(current>=target)return "km";String time=stage(today,due,false);if("due".equals(time))return time;if(target-current<=warn)return "km-soon";return time;}
}
